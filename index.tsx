/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";

function main() {
  // DOM Elements
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const encodingSelector = document.getElementById('encodingSelector') as HTMLSelectElement;
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
  const geminiApiKeyInput = document.getElementById('geminiApiKeyInput') as HTMLInputElement;
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
  let fullFileContent = ''; // For session persistence
  let currentFileName = ''; // For session persistence
  interface OpenAIModelConfig {
    id: string;
    name: string;
    baseUrl: string;
    modelName: string;
    apiKey: string;
  }
  let openAIModels: OpenAIModelConfig[] = [];


  // --- Session Persistence Logic ---
  function saveSessionState() {
    if (!fullFileContent || currentChapterIndex < 0) return;
    try {
      localStorage.setItem('session_fullFileContent', fullFileContent);
      localStorage.setItem('session_fileName', currentFileName);
      localStorage.setItem('session_encoding', encodingSelector.value);
      localStorage.setItem('session_currentChapterIndex', String(currentChapterIndex));
      localStorage.setItem('session_transformedContent', transformedContent.textContent || '');
      const activeTab = originalTabButton.classList.contains('active') ? 'original' : 'transformed';
      localStorage.setItem('session_activeTab', activeTab);
    } catch (e) {
      console.error("Failed to save session state:", e);
    }
  }

  function loadSessionState(): boolean {
    const savedContent = localStorage.getItem('session_fullFileContent');
    if (!savedContent) return false;

    try {
        fullFileContent = savedContent;
        currentFileName = localStorage.getItem('session_fileName') || '';
        const savedEncoding = localStorage.getItem('session_encoding') || 'utf-8';
        const savedIndex = parseInt(localStorage.getItem('session_currentChapterIndex') || '0', 10);
        const savedTransformedContent = localStorage.getItem('session_transformedContent') || '';
        const savedActiveTab = (localStorage.getItem('session_activeTab') || 'original') as 'original' | 'transformed';

        encodingSelector.value = savedEncoding;
        
        chapters = splitIntoChapters(fullFileContent);
        if (chapters.length > 0) {
            renderTableOfContents();
            displayChapter(savedIndex, false); // false to not reset transformed content

            if(savedTransformedContent) {
                transformedContent.textContent = savedTransformedContent;
                transformedTabButton.disabled = false;
            }

            switchTab(savedActiveTab);
            
            introSection.classList.add('hidden');
            contentWrapper.classList.remove('hidden');
            closeFileButton.classList.remove('hidden');
            return true;
        }
        return false;
    } catch (e) {
        console.error("Failed to load session state:", e);
        clearSessionState();
        return false;
    }
  }

  function clearSessionState() {
      localStorage.removeItem('session_fullFileContent');
      localStorage.removeItem('session_fileName');
      localStorage.removeItem('session_encoding');
      localStorage.removeItem('session_currentChapterIndex');
      localStorage.removeItem('session_transformedContent');
      localStorage.removeItem('session_activeTab');
  }


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
    localStorage.setItem('geminiApiKey', geminiApiKeyInput.value);
    
    const updatedOpenAIModels: OpenAIModelConfig[] = [];
    const modelItems = openAIModelsListDiv.querySelectorAll('.openai-model-item');
    modelItems.forEach(item => {
      const form = item.querySelector('.openai-model-form');
      if (form) {
          const id = (form.querySelector('[data-id]') as HTMLElement).dataset.id;
          const name = (form.querySelector('[data-name]') as HTMLInputElement).value;
          const baseUrl = (form.querySelector('[data-baseurl]') as HTMLInputElement).value;
          const modelName = (form.querySelector('[data-modelname]') as HTMLInputElement).value;
          const apiKey = (form.querySelector('[data-apikey]') as HTMLInputElement).value;
          if (id && name && baseUrl && modelName) { // api key can be optional visually
              updatedOpenAIModels.push({ id, name, baseUrl, modelName, apiKey });
          }
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
    geminiApiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
    
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
      } else {
          openAIModels.forEach(model => {
              const modelItem = createOpenAIModelListItem(model);
              openAIModelsListDiv.appendChild(modelItem);
          });
      }
  }

  function createOpenAIModelListItem(model?: OpenAIModelConfig) {
      const modelId = model?.id || `model-${Date.now()}`;
      const container = document.createElement('div');
      container.className = 'openai-model-item';

      const header = document.createElement('div');
      header.className = 'openai-model-header';
      header.innerHTML = `
          <span class="model-name-display">${model?.name || 'New Model'}</span>
          <span class="accordion-chevron"></span>
      `;

      const details = document.createElement('div');
      details.className = 'openai-model-details';
      details.innerHTML = `
        <div class="openai-model-form">
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
        </div>
      `;

      container.appendChild(header);
      container.appendChild(details);

      header.addEventListener('click', () => {
          const isExpanded = container.classList.contains('expanded');
          openAIModelsListDiv.querySelectorAll('.openai-model-item.expanded').forEach(item => {
              item.classList.remove('expanded');
          });
          if (!isExpanded) {
              container.classList.add('expanded');
          }
      });

      const nameInput = details.querySelector<HTMLInputElement>('[data-name]');
      nameInput?.addEventListener('input', () => {
          const displayName = header.querySelector<HTMLElement>('.model-name-display');
          if (displayName) {
              displayName.textContent = nameInput.value || 'New Model';
          }
      });

      details.querySelector('.button-remove')?.addEventListener('click', (e) => {
          e.stopPropagation();
          const currentName = nameInput?.value || 'this model';
          if(confirm(`Are you sure you want to remove model "${currentName}"?`)){
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
      
      openAIModelsListDiv.querySelectorAll('.openai-model-item.expanded').forEach(item => {
          item.classList.remove('expanded');
      });

      const newItem = createOpenAIModelListItem();
      openAIModelsListDiv.appendChild(newItem);
      newItem.classList.add('expanded');
      newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });


  settingsButton.addEventListener('click', openSettings);
  closeSettingsButton.addEventListener('click', closeSettings);
  saveSettingsButton.addEventListener('click', saveSettings);
  settingsPanel.addEventListener('click', (event) => {
      if (event.target === settingsPanel) {
          closeSettings();
      }
  });

  // --- Settings Accordion Logic ---
  const accordionHeaders = document.querySelectorAll('.settings-accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const parentItem = header.closest('.settings-accordion-item');
      if (!parentItem || parentItem.classList.contains('expanded')) {
        return;
      }
      const settingsContainer = parentItem.closest('.settings-accordion');
      const currentlyExpanded = settingsContainer?.querySelector('.settings-accordion-item.expanded');
      
      if (currentlyExpanded) {
        currentlyExpanded.classList.remove('expanded');
      }
      parentItem.classList.add('expanded');
    });
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
    saveSessionState();
  }
  originalTabButton.addEventListener('click', () => switchTab('original'));
  transformedTabButton.addEventListener('click', () => switchTab('transformed'));


  // --- File Handling and Chapter Logic ---
  fileInput.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    resetState();
    if (!file || !file.name.toLowerCase().endsWith('.txt')) { alert('Error: Please select a valid .txt file.'); return; }
    
    currentFileName = file.name;
    const reader = new FileReader();

    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        const encoding = encodingSelector.value;
        try {
            fullFileContent = new TextDecoder(encoding).decode(buffer);
        } catch (error) {
            console.error('File decoding error:', error);
            alert(`Failed to decode the file with ${encoding} encoding. The file might be corrupt or the wrong encoding was selected.`);
            return;
        }
        
        chapters = splitIntoChapters(fullFileContent);
        if (chapters.length > 0) {
          renderTableOfContents(); 
          displayChapter(0);
          introSection.classList.add('hidden'); 
          contentWrapper.classList.remove('hidden');
          closeFileButton.classList.remove('hidden');
          saveSessionState();
        } else { alert('Could not find any content to process in the file.'); }
      } else { alert('Error: Could not read file content.'); }
    };
    reader.onerror = () => alert('Error: An error occurred while reading the file.');
    reader.readAsArrayBuffer(file);
  });

  function splitIntoChapters(text: string): { title: string; content: string }[] {
      if (!text || !text.trim()) return [];
  
      const MAX_CHUNK_SIZE = 2000;
      const chapterHeadingRegex = /^(?:(chapter|part|book)\s+([0-9IVXLCDM]+|one|two|three|four|five|six|seven|eight|nine|ten)\.?|第\s*([0-9一二三四五六七八九十百千万零]+)\s*[章篇回]|卷\s*([0-9一二三四五六七八九十百千万零]+))/im;
  
      const lines = text.split('\n');
      const initialChapters: { title: string; content: string }[] = [];
      let currentChapterContent: string[] = [];
      let currentChapterTitle = "Prologue"; // Default for content before the first heading
      let headingsFound = false;
  
      // 1. Primary Split by Headings
      for (const line of lines) {
          if (chapterHeadingRegex.test(line.trim())) {
              headingsFound = true;
              if (currentChapterContent.join('').trim()) {
                  initialChapters.push({
                      title: currentChapterTitle,
                      content: currentChapterContent.join('\n').trim()
                  });
              }
              currentChapterTitle = line.trim();
              currentChapterContent = [];
          } else {
              currentChapterContent.push(line);
          }
      }
      // Add the last chapter
      if (currentChapterContent.join('').trim()) {
          initialChapters.push({
              title: currentChapterTitle,
              content: currentChapterContent.join('\n').trim()
          });
      }
  
      // If no headings were found, the whole text is one initial chapter.
      if (!headingsFound && initialChapters.length > 0) {
          initialChapters[0].title = "Full Text";
      }
  
      // Clean up potential empty "Prologue" if headings were found
      if (headingsFound && initialChapters.length > 0 && initialChapters[0].title === 'Prologue' && !initialChapters[0].content.trim()) {
          initialChapters.shift();
      }
      
      if (initialChapters.length === 0) return [];
  
      // 2. Secondary Split (Sub-chunking)
      const finalChapters: { title: string; content: string }[] = [];
      for (const chapter of initialChapters) {
          if (chapter.content.length <= MAX_CHUNK_SIZE) {
              // Chapter is small enough, add it directly.
              finalChapters.push({
                  title: chapter.title,
                  content: `${chapter.title}\n\n${chapter.content}`
              });
          } else {
              // Chapter is too long, need to sub-chunk it.
              let remainingContent = chapter.content;
              let part = 1;
              while (remainingContent.length > 0) {
                  let newTitle: string;
                  let newContent: string;
                  let chunk: string;
  
                  if (remainingContent.length <= MAX_CHUNK_SIZE) {
                      chunk = remainingContent;
                      remainingContent = '';
                  } else {
                      // Find a good split point (a newline) backwards from the max size.
                      let splitIndex = remainingContent.lastIndexOf('\n', MAX_CHUNK_SIZE);
                      // If no newline is found or it's at the very beginning, force a split.
                      if (splitIndex <= 0) {
                          splitIndex = MAX_CHUNK_SIZE;
                      }
                      chunk = remainingContent.substring(0, splitIndex);
                      remainingContent = remainingContent.substring(splitIndex).trim();
                  }
                  
                  if (chunk.trim()) {
                      if (part === 1) {
                          // First part of a long chapter
                          newTitle = chapter.title;
                          newContent = `${chapter.title}\n\n${chunk.trim()}`;
                      } else {
                          // Subsequent parts of a long chapter
                          newTitle = `${chapter.title} (Part ${part})`;
                          newContent = chunk.trim();
                      }
                     finalChapters.push({
                         title: newTitle,
                         content: newContent
                     });
                  }
                  part++;
              }
          }
      }
  
      return finalChapters;
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

  function displayChapter(index: number, isNewSelection = true) {
      if (index < 0 || index >= chapters.length) return;
      currentChapterIndex = index;
      fileContent.textContent = chapters[index].content;
      transformButton.disabled = false;
      
      if (isNewSelection) {
        transformedContent.textContent = '';
        transformedTabButton.disabled = true;
        switchTab('original');
      }

      document.querySelectorAll('#tocList button').forEach((btn, i) => btn.classList.toggle('active', i === index));
      fileContent.scrollTop = 0;
      closeTocPanel();
      saveSessionState();
  }

  function resetState() {
    chapters = []; currentChapterIndex = -1;
    fullFileContent = ''; currentFileName = '';
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
    clearSessionState();
  }

  closeFileButton.addEventListener('click', resetState);

  // --- AI Transformation Logic ---
  async function transformWithGemini(prompt: string, modelName: string, apiKey: string): Promise<string> {
      const keyToUse = apiKey || process.env.API_KEY;
      if (!keyToUse) {
        throw new Error('Gemini API key is not configured. Please add it in the settings.');
      }
      const ai = new GoogleGenAI({ apiKey: keyToUse });
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
          const apiKey = localStorage.getItem('geminiApiKey') || '';
          if (!modelName) throw new Error("Gemini model name is not set.");
          transformedText = await transformWithGemini(prompt, modelName, apiKey);
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
        saveSessionState();
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
  if (!loadSessionState()) {
      // No session found, normal startup
  }
}

// Ensures the script runs only after the DOM is fully loaded, preventing race conditions.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}