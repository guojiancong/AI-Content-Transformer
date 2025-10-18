/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";

function main() {
  // DOM Elements
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const transformButton = document.getElementById('transformButton') as HTMLButtonElement;
  const introSection = document.getElementById('intro-section') as HTMLElement;
  const contentWrapper = document.getElementById('content-wrapper') as HTMLElement;
  const modelSelector = document.getElementById('modelSelector') as HTMLSelectElement;
  const closeFileButton = document.getElementById('closeFileButton') as HTMLButtonElement;

  // Settings Panel Elements
  const settingsButton = document.getElementById('settingsButton') as HTMLButtonElement;
  const settingsPanel = document.getElementById('settingsPanel') as HTMLElement;
  const closeSettingsButton = document.getElementById('closeSettingsButton') as HTMLButtonElement;
  const saveSettingsButton = document.getElementById('saveSettingsButton') as HTMLButtonElement;
  const writerStyleInput = document.getElementById('writerStyleInput') as HTMLInputElement;
  const customPromptInput = document.getElementById('customPromptInput') as HTMLTextAreaElement;
  const geminiModelInput = document.getElementById('geminiModelInput') as HTMLInputElement;
  const openAIModelsListDiv = document.getElementById('openai-models-list') as HTMLDivElement;
  const addOpenAiModelButton = document.getElementById('addOpenAiModel') as HTMLButtonElement;

  // Table of Contents Elements
  const tocToggleButton = document.getElementById('toc-toggle-button') as HTMLButtonElement;
  const tocCloseButton = document.getElementById('toc-close-button') as HTMLButtonElement;
  const tableOfContentsSection = document.getElementById('tableOfContentsSection') as HTMLElement;
  const tocList = document.getElementById('tocList') as HTMLUListElement;

  // Content & Tab Elements
  const chapterContentSection = document.getElementById('chapter-content-section') as HTMLElement;
  const fileContent = document.getElementById('fileContent') as HTMLPreElement;
  const transformedContent = document.getElementById('transformedContent') as HTMLPreElement;
  const originalTabButton = document.getElementById('originalTabButton') as HTMLButtonElement;
  const transformedTabButton = document.getElementById('transformedTabButton') as HTMLButtonElement;
  const originalTabPanel = document.getElementById('originalTabPanel') as HTMLElement;
  const transformedTabPanel = document.getElementById('transformedTabPanel') as HTMLElement;

  // App State
  let chapters: { title: string; content: string }[] = [];
  let currentChapterIndex = -1;
  interface OpenAIModelConfig {
    id: string;
    name: string;
    baseUrl: string;
    modelName: string;
    apiKey: string;
  }
  let openAIModels: OpenAIModelConfig[] = [];


  // --- Settings Panel Logic ---

  function openSettings() {
    renderOpenAIModelsList();
    settingsPanel.style.display = 'flex';
  }

  function closeSettings() {
    settingsPanel.style.display = 'none';
  }

  function saveSettings() {
    localStorage.setItem('writerStyle', writerStyleInput.value);
    localStorage.setItem('customPrompt', customPromptInput.value);
    localStorage.setItem('geminiModel', geminiModelInput.value);
    
    const updatedOpenAIModels: OpenAIModelConfig[] = [];
    const modelForms = openAIModelsListDiv.querySelectorAll('.openai-model-form');
    modelForms.forEach(form => {
      const id = (form.querySelector('[data-id]') as HTMLElement).dataset.id;
      const name = (form.querySelector('[data-name]') as HTMLInputElement).value;
      const baseUrl = (form.querySelector('[data-baseurl]') as HTMLInputElement).value;
      const modelName = (form.querySelector('[data-modelname]') as HTMLInputElement).value;
      const apiKey = (form.querySelector('[data-apikey]') as HTMLInputElement).value;
      if (id && name && baseUrl && modelName) { // api key can be optional visually
          updatedOpenAIModels.push({ id, name, baseUrl, modelName, apiKey });
      }
    });
    openAIModels = updatedOpenAIModels;
    localStorage.setItem('openAIModels', JSON.stringify(openAIModels));

    populateModelSelector();
    alert('Settings saved!');
    closeSettings();
  }

  function loadSettings() {
    writerStyleInput.value = localStorage.getItem('writerStyle') || 'a famous poet';
    const defaultPrompt = `Rewrite the following text in the style of {writerStyle}. Do not add any preamble or introductory text, just provide the rewritten text directly.\n\nTEXT:\n"""\n{originalText}\n"""`;
    customPromptInput.value = localStorage.getItem('customPrompt') || defaultPrompt;
    geminiModelInput.value = localStorage.getItem('geminiModel') || 'gemini-2.5-flash';
    
    try {
      openAIModels = JSON.parse(localStorage.getItem('openAIModels') || '[]');
    } catch (e) {
      console.error("Failed to parse OpenAI models from localStorage", e);
      openAIModels = [];
    }
    populateModelSelector();
  }

  function renderOpenAIModelsList() {
      openAIModelsListDiv.innerHTML = '';
      if (openAIModels.length === 0) {
          openAIModelsListDiv.innerHTML = '<p class="no-models-message">No OpenAI compatible models configured.</p>';
      }
      openAIModels.forEach(model => {
          const form = createOpenAIModelForm(model);
          openAIModelsListDiv.appendChild(form);
      });
  }

  function createOpenAIModelForm(model?: OpenAIModelConfig) {
      const modelId = model?.id || `model-${Date.now()}`;
      const container = document.createElement('div');
      container.className = 'openai-model-form';
      container.innerHTML = `
          <div class="form-group">
              <label>Display Name</label>
              <input type="text" data-name value="${model?.name || ''}" placeholder="My Llama 3">
          </div>
          <div class="form-group">
              <label>API Base URL</label>
              <input type="url" data-baseurl value="${model?.baseUrl || ''}" placeholder="https://api.example.com/v1">
          </div>
          <div class="form-group">
              <label>Model Name</label>
              <input type="text" data-modelname value="${model?.modelName || ''}" placeholder="llama3-70b-8192">
          </div>
          <div class="form-group">
              <label>API Key</label>
              <input type="password" data-apikey value="${model?.apiKey || ''}" placeholder="sk-...">
          </div>
          <button type="button" class="button-remove">Remove</button>
          <span data-id="${modelId}" style="display:none;"></span>
      `;
      container.querySelector('.button-remove')?.addEventListener('click', () => {
          if(confirm(`Are you sure you want to remove model "${model?.name || 'this model'}"?`)){
              container.remove();
              if (openAIModelsListDiv.childElementCount === 0) {
                   openAIModelsListDiv.innerHTML = '<p class="no-models-message">No OpenAI compatible models configured.</p>';
              }
          }
      });
      return container;
  }

  addOpenAiModelButton.addEventListener('click', () => {
      const noModelsMessage = openAIModelsListDiv.querySelector('.no-models-message');
      if (noModelsMessage) noModelsMessage.remove();
      const newForm = createOpenAIModelForm();
      openAIModelsListDiv.appendChild(newForm);
  });


  settingsButton.addEventListener('click', openSettings);
  closeSettingsButton.addEventListener('click', closeSettings);
  saveSettingsButton.addEventListener('click', saveSettings);
  settingsPanel.addEventListener('click', (event) => {
      if (event.target === settingsPanel) {
          closeSettings();
      }
  });

  // --- Model Selector Logic ---
  function populateModelSelector() {
      modelSelector.innerHTML = '';
      const geminiModel = localStorage.getItem('geminiModel') || 'gemini-2.5-flash';
      
      const geminiOption = document.createElement('option');
      geminiOption.value = 'google';
      geminiOption.textContent = `Gemini: ${geminiModel}`;
      modelSelector.appendChild(geminiOption);

      openAIModels.forEach(model => {
          const option = document.createElement('option');
          option.value = `openai-${model.id}`;
          option.textContent = `OpenAI: ${model.name}`;
          modelSelector.appendChild(option);
      });

      const lastSelectedModel = localStorage.getItem('lastSelectedModel');
      if(lastSelectedModel && modelSelector.querySelector(`[value="${lastSelectedModel}"]`)) {
          modelSelector.value = lastSelectedModel;
      }
  }

  modelSelector.addEventListener('change', () => {
      localStorage.setItem('lastSelectedModel', modelSelector.value);
  });


  // --- Table of Contents Mobile Logic ---
  function openTocPanel() { tableOfContentsSection.classList.add('visible'); }
  function closeTocPanel() { tableOfContentsSection.classList.remove('visible'); }
  tocToggleButton.addEventListener('click', openTocPanel);
  tocCloseButton.addEventListener('click', closeTocPanel);
  tableOfContentsSection.addEventListener('click', (e) => { if (e.target === tableOfContentsSection) closeTocPanel(); });


  // --- Tab Logic ---
  function switchTab(targetTab: 'original' | 'transformed') {
    const isOriginal = targetTab === 'original';
    originalTabButton.classList.toggle('active', isOriginal);
    transformedTabButton.classList.toggle('active', !isOriginal);
    originalTabPanel.classList.toggle('active', isOriginal);
    transformedTabPanel.classList.toggle('active', !isOriginal);
  }
  originalTabButton.addEventListener('click', () => switchTab('original'));
  transformedTabButton.addEventListener('click', () => switchTab('transformed'));


  // --- File Handling and Chapter Logic ---
  fileInput.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    resetState();
    if (!file || !file.name.toLowerCase().endsWith('.txt')) { alert('Error: Please select a valid .txt file.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (typeof result === 'string') {
        chapters = splitIntoChapters(result);
        if (chapters.length > 0) {
          renderTableOfContents(); displayChapter(0);
          introSection.classList.add('hidden'); 
          contentWrapper.classList.remove('hidden');
          closeFileButton.classList.remove('hidden');
        } else { alert('Could not find any content to process in the file.'); }
      } else { alert('Error: Could not read file content as text.'); }
    };
    reader.onerror = () => alert('Error: An error occurred while reading the file.');
    reader.readAsText(file);
  });

  function splitIntoChapters(text: string): { title: string; content: string }[] {
      if (!text || !text.trim()) return [];
      const chapterHeadingRegex = /^(?:(chapter|part|book)\s+([0-9IVXLCDM]+|one|two|three|four|five|six|seven|eight|nine|ten)\.?|第\s*([0-9一二三四五六七八九十百千万零]+)\s*[章节篇]|卷\s*([0-9一二三四五六七八九十百千万零]+))\s*$/im;
      const lines = text.split('\n');
      const foundChapters: { title: string; content: string }[] = [];
      let currentChapterContent: string[] = [];
      let currentChapterTitle = "Prologue";
      let headingsFound = false;
      for (const line of lines) {
          if (chapterHeadingRegex.test(line.trim())) {
              headingsFound = true;
              if (currentChapterContent.length > 0) foundChapters.push({ title: currentChapterTitle, content: currentChapterContent.join('\n').trim() });
              currentChapterTitle = line.trim();
              currentChapterContent = [];
          } else { currentChapterContent.push(line); }
      }
      foundChapters.push({ title: currentChapterTitle, content: currentChapterContent.join('\n').trim() });
      if (!headingsFound) {
          const textToChunk = foundChapters[0].content;
          const chunkedChapters: { title: string; content: string }[] = [];
          const MAX_CHUNK_SIZE = 2000; let currentChunk = '';
          const chunkLines = textToChunk.split('\n');
          for (const line of chunkLines) {
              if (currentChunk.length + line.length > MAX_CHUNK_SIZE) {
                  if (currentChunk.trim()) chunkedChapters.push({ title: `Part ${chunkedChapters.length + 1}`, content: currentChunk.trim() });
                  currentChunk = '';
              }
              currentChunk += line + '\n';
          }
          if (currentChunk.trim()) chunkedChapters.push({ title: `Part ${chunkedChapters.length + 1}`, content: currentChunk.trim() });
          return chunkedChapters;
      }
      if (foundChapters.length > 1 && foundChapters[0].title === 'Prologue' && !foundChapters[0].content.trim()) foundChapters.shift();
      return foundChapters;
  }

  function renderTableOfContents() {
      tocList.innerHTML = '';
      chapters.forEach((chapter, index) => {
          const li = document.createElement('li'); const button = document.createElement('button');
          button.type = 'button'; button.textContent = chapter.title; button.dataset.index = String(index);
          button.addEventListener('click', () => displayChapter(index));
          li.appendChild(button); tocList.appendChild(li);
      });
  }

  function displayChapter(index: number) {
      if (index < 0 || index >= chapters.length) return;
      currentChapterIndex = index;
      fileContent.textContent = chapters[index].content;
      transformButton.disabled = false; transformedContent.textContent = ''; transformedTabButton.disabled = true;
      switchTab('original');
      document.querySelectorAll('#tocList button').forEach((btn, i) => btn.classList.toggle('active', i === index));
      fileContent.scrollTop = 0; closeTocPanel();
  }

  function resetState() {
    chapters = []; currentChapterIndex = -1;
    contentWrapper.classList.add('hidden'); 
    introSection.classList.remove('hidden');
    tocList.innerHTML = ''; 
    fileContent.textContent = ''; 
    transformedContent.textContent = '';
    transformButton.disabled = true; 
    switchTab('original'); 
    transformedTabButton.disabled = true;
    closeFileButton.classList.add('hidden');
    fileInput.value = ''; // Clear the file input
  }

  closeFileButton.addEventListener('click', resetState);

  // --- AI Transformation Logic ---
  async function transformWithGemini(prompt: string, modelName: string): Promise<string> {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({ model: modelName, contents: prompt });
      return response.text;
  }

  async function transformWithOpenAI(prompt: string, config: OpenAIModelConfig): Promise<string> {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
          body: JSON.stringify({ model: config.modelName, messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`OpenAI API Error: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      const data = await response.json();
      return data.choices[0]?.message?.content || '';
  }

  transformButton.addEventListener('click', async () => {
    if (currentChapterIndex === -1) return;
    const originalText = chapters[currentChapterIndex].content;
    const writerStyle = localStorage.getItem('writerStyle');
    const customPromptTemplate = localStorage.getItem('customPrompt');
    const selectedModel = modelSelector.value;
    if (!originalText) { alert('There is no content in this chapter to transform.'); return; }
    if (!writerStyle) { alert('Please configure your writer style in settings first.'); openSettings(); return; }
    if (!customPromptTemplate) { alert('Could not find the custom prompt in settings.'); openSettings(); return; }

    transformedContent.textContent = 'Transforming with AI...';
    transformButton.disabled = true; transformedTabButton.disabled = false; switchTab('transformed');

    const prompt = customPromptTemplate
      .replace('{writerStyle}', writerStyle)
      .replace('{originalText}', originalText);
      
    let transformedText = '';

    try {
      if (selectedModel === 'google') {
          const modelName = localStorage.getItem('geminiModel');
          if (!modelName) throw new Error("Gemini model name is not set.");
          transformedText = await transformWithGemini(prompt, modelName);
      } else if (selectedModel.startsWith('openai-')) {
          const modelId = selectedModel.replace('openai-', '');
          const modelConfig = openAIModels.find(m => m.id === modelId);
          if (!modelConfig) throw new Error(`Could not find configuration for selected OpenAI model.`);
          transformedText = await transformWithOpenAI(prompt, modelConfig);
      } else {
          throw new Error(`Unknown model selection: ${selectedModel}`);
      }

      if (transformedText && transformedText.trim().length > 0) {
        transformedContent.textContent = transformedText;
      } else {
        transformedContent.textContent = 'The AI did not return any content. This might be due to content safety filters or an issue with the prompt.';
      }
    } catch (e: any) {
      console.error('AI Transformation Error:', e);
      transformedContent.textContent = `An error occurred during transformation. Please check your settings and the console for more details.\n\nError: ${e.message}`;
    } finally {
      transformButton.disabled = false;
    }
  });

  // --- Initial Load ---
  loadSettings();
}

// Ensures the script runs only after the DOM is fully loaded, preventing race conditions.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}