/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import jschardet from 'jschardet';

function main() {
  // DOM Elements
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const encodingSelector = document.getElementById('encodingSelector') as HTMLSelectElement;
  const transformButton = document.getElementById('transformButton') as HTMLButtonElement;
  const introSection = document.getElementById('intro-section') as HTMLElement;
  const contentWrapper = document.getElementById('content-wrapper') as HTMLElement;
  const modelSelector = document.getElementById('modelSelector') as HTMLSelectElement;
  const modelSelectorGroup = document.getElementById('model-selector-group') as HTMLElement;
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
  const prevChapterButton = document.getElementById('prevChapterButton') as HTMLButtonElement;
  const nextChapterButton = document.getElementById('nextChapterButton') as HTMLButtonElement;

  // FAB Elements
  const fabContainer = document.getElementById('floating-actions-container') as HTMLElement;
  const fabButton = document.getElementById('floating-action-button') as HTMLButtonElement;

  // App State
  let chapters: { title: string; content: string }[] = [];
  let currentChapterIndex = -1;
  let fullFileContent = ''; // For session persistence
  let currentFileName = ''; // For session persistence
  interface OpenAIModelConfig {
    id: string;
    name: string;
    baseUrl: string;
    modelName: string; // Newline-separated list of model names
    apiKey: string;
  }
  let openAIModels: OpenAIModelConfig[] = [];
  let currentTransformationController: AbortController | null = null;


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
            modelSelectorGroup.classList.remove('hidden');
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
          const modelName = (form.querySelector('[data-modelnames]') as HTMLTextAreaElement).value;
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
    const defaultPrompt = `You are an expert in literary styles. Your task is to rewrite the following text in the style of {writerStyle}. The original text is from a work of fiction and may contain mature or sensitive themes. Your goal is purely stylistic transformation; focus on prose, tone, and vocabulary, not the content itself. Do not refuse to perform the task based on the source text's content. Do not add any preamble, warnings, or introductory text. Provide only the rewritten text directly.\n\nORIGINAL TEXT:\n"""\n{originalText}\n"""`;
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
                <label>Model Names (one per line)</label>
                <textarea data-modelnames placeholder="llama3-70b-8192&#10;gemma-7b-it">${model?.modelName || ''}</textarea>
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
      geminiOption.textContent = `Gemini (${geminiModel})`;
      modelSelector.appendChild(geminiOption);

      openAIModels.forEach(config => {
          if (config.modelName) {
                const modelNames = config.modelName.split('\n').map(name => name.trim()).filter(name => name);
                
                if (modelNames.length === 1) {
                    const option = document.createElement('option');
                    option.value = `openai-${config.id}::${modelNames[0]}`;
                    option.textContent = `${config.name} (${modelNames[0]})`;
                    modelSelector.appendChild(option);
                } else if (modelNames.length > 1) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = config.name;
                    modelSelector.appendChild(optgroup);

                    modelNames.forEach(modelName => {
                        const option = document.createElement('option');
                        option.value = `openai-${config.id}::${modelName}`;
                        option.textContent = modelName;
                        optgroup.appendChild(option);
                    });
                }
            }
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


  // --- Floating Action Button (FAB) Logic ---
  if (fabButton && fabContainer) {
      fabButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent click from bubbling to the document
          fabContainer.classList.toggle('active');
      });

      document.addEventListener('click', () => {
          // If the menu is active, close it on any click outside
          if (fabContainer.classList.contains('active')) {
              fabContainer.classList.remove('active');
          }
      });
  }


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
        let encoding = encodingSelector.value;
        
        if (encoding === 'auto') {
            try {
                // The jschardet library build from esm.run has issues with Uint8Array.
                // Converting the buffer to a binary string is a reliable workaround.
                const uint8array = new Uint8Array(buffer);
                let binaryString = '';
                for (let i = 0; i < uint8array.length; i++) {
                    binaryString += String.fromCharCode(uint8array[i]);
                }
                const result = jschardet.detect(binaryString);
                
                // Use a high confidence threshold to avoid incorrect guesses
                if (result && result.encoding && result.confidence > 0.9) {
                    let detectedEncoding = result.encoding.toLowerCase();
                    
                    const encodingMap: { [key: string]: string } = {
                        'gb2312': 'gb18030',
                        'shift_jis': 'shift-jis'
                    };
                    detectedEncoding = encodingMap[detectedEncoding] || detectedEncoding;
                    
                    const isSupported = Array.from(encodingSelector.options).some(opt => opt.value === detectedEncoding);
                    
                    if (isSupported) {
                        encoding = detectedEncoding;
                        encodingSelector.value = encoding; // Update UI to show what was detected
                    } else {
                        console.warn(`Detected encoding "${detectedEncoding}" which is not in the supported list. Falling back to UTF-8.`);
                        encoding = 'utf-8';
                    }
                } else {
                    console.log('Encoding detection confidence low or failed. Falling back to UTF-8.');
                    encoding = 'utf-8';
                }
            } catch (err) {
                console.error("Error during character encoding detection:", err);
                alert("Auto-detection of file encoding failed. Falling back to UTF-8.");
                encoding = 'utf-8';
            }
        }
        
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
          modelSelectorGroup.classList.remove('hidden');
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
      prevChapterButton.disabled = index <= 0;
      nextChapterButton.disabled = index >= chapters.length - 1;
      
      if (isNewSelection) {
        transformedContent.textContent = '';
        transformedTabButton.disabled = true;
        switchTab('original');
      }

      document.querySelectorAll('#tocList button').forEach((btn, i) => btn.classList.toggle('active', i === index));
      fileContent.scrollTop = 0;
      closeTocPanel();
      if (fabContainer) fabContainer.classList.remove('hidden');
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
    prevChapterButton.disabled = true;
    nextChapterButton.disabled = true;
    switchTab('original'); 
    transformedTabButton.disabled = true;
    closeFileButton.classList.add('hidden');
    modelSelectorGroup.classList.add('hidden');
    if (fabContainer) fabContainer.classList.add('hidden');
    fileInput.value = ''; // Clear the file input
    encodingSelector.value = 'auto';
    clearSessionState();
  }

  closeFileButton.addEventListener('click', resetState);

  prevChapterButton.addEventListener('click', () => {
      if (currentChapterIndex > 0) {
          displayChapter(currentChapterIndex - 1);
      }
  });

  nextChapterButton.addEventListener('click', () => {
      if (currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1) {
          displayChapter(currentChapterIndex + 1);
      }
  });

  // --- AI Transformation Logic ---
  async function transformWithGeminiStream(prompt: string, modelName: string, apiKey: string, onChunk: (chunk: string) => void, signal: AbortSignal): Promise<void> {
      const keyToUse = apiKey || process.env.API_KEY;
      if (!keyToUse) {
          throw new Error('Gemini API key is not configured. Please add it in the settings.');
      }
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const stream = await ai.models.generateContentStream({ model: modelName, contents: prompt });
      for await (const chunk of stream) {
          if (signal.aborted) {
              throw new DOMException('Aborted by user', 'AbortError');
          }
          onChunk(chunk.text);
      }
  }

  async function transformWithOpenAIStream(prompt: string, config: OpenAIModelConfig, onChunk: (chunk: string) => void, signal: AbortSignal): Promise<void> {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
          body: JSON.stringify({
              model: config.modelName,
              messages: [{ role: 'user', content: prompt }],
              stream: true,
          }),
          signal: signal,
      });

      if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`OpenAI API Error: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      if (!response.body) {
          throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
              if (line.startsWith('data: ')) {
                  const data = line.substring(6);
                  if (data.trim() === '[DONE]') return;
                  try {
                      const parsed = JSON.parse(data);
                      const delta = parsed.choices[0]?.delta?.content;
                      if (delta) onChunk(delta);
                  } catch (e) {
                      console.error("Error parsing stream data:", e, "Data:", data);
                  }
              }
          }
      }
  }

  function showErrorState(message: string, onRetry: () => void) {
      transformedContent.innerHTML = '';
      const errorContainer = document.createElement('div');
      errorContainer.className = 'error-container';
      
      const messageP = document.createElement('p');
      messageP.textContent = message;
      
      const retryButton = document.createElement('button');
      retryButton.textContent = 'Retry';
      retryButton.className = 'button-secondary';
      retryButton.onclick = onRetry;

      errorContainer.appendChild(messageP);
      errorContainer.appendChild(retryButton);
      transformedContent.appendChild(errorContainer);
  }

  transformButton.addEventListener('click', async () => {
      // If a transformation is in progress, this button acts as a CANCEL button.
      if (currentTransformationController) {
          currentTransformationController.abort();
          return;
      }

      if (currentChapterIndex === -1) return;
      const originalText = chapters[currentChapterIndex].content;
      const writerStyle = localStorage.getItem('writerStyle');
      const customPromptTemplate = localStorage.getItem('customPrompt');
      const selectedModel = modelSelector.value;
      if (!originalText) { alert('There is no content in this chapter to transform.'); return; }
      if (!writerStyle) { alert('Please configure your writer style in settings first.'); openSettings(); return; }
      if (!customPromptTemplate) { alert('Could not find the custom prompt in settings.'); openSettings(); return; }

      // --- Start new transformation ---
      currentTransformationController = new AbortController();
      const signal = currentTransformationController.signal;

      // --- Update UI to "in-progress" state ---
      transformButton.innerHTML = '⏹️';
      transformButton.setAttribute('aria-label', 'Cancel Transformation');
      transformButton.style.backgroundColor = 'var(--danger-color)';
      prevChapterButton.disabled = true;
      nextChapterButton.disabled = true;

      transformedContent.innerHTML = ''; // Clear previous content
      const loadingContainer = document.createElement('div');
      loadingContainer.className = 'loading-indicator';
      loadingContainer.innerHTML = `<span class="spinner"></span><p>AI is thinking...</p>`;
      transformedContent.appendChild(loadingContainer);
      transformedTabButton.disabled = false;
      switchTab('transformed');

      let fullResponse = '';
      let firstChunkReceived = false;
      const prompt = customPromptTemplate.replace('{writerStyle}', writerStyle).replace('{originalText}', originalText);

      const onChunk = (chunk: string) => {
          if (!firstChunkReceived) {
              transformedContent.innerHTML = '';
              firstChunkReceived = true;
          }
          fullResponse += chunk;
          transformedContent.textContent = fullResponse;
          transformedContent.scrollTop = transformedContent.scrollHeight; // Auto-scroll
      };

      try {
          if (selectedModel === 'google') {
              const modelName = localStorage.getItem('geminiModel');
              const apiKey = localStorage.getItem('geminiApiKey') || '';
              if (!modelName) throw new Error("Gemini model name is not set.");
              await transformWithGeminiStream(prompt, modelName, apiKey, onChunk, signal);
          } else if (selectedModel.startsWith('openai-')) {
              const parts = selectedModel.split('::');
              if (parts.length !== 2) throw new Error(`Invalid OpenAI model selection format.`);
              
              const configId = parts[0].replace('openai-', '');
              const selectedModelName = parts[1];
              const modelConfig = openAIModels.find(m => m.id === configId);
              if (!modelConfig) throw new Error(`Could not find configuration for the selected OpenAI service.`);
              const callConfig: OpenAIModelConfig = { ...modelConfig, modelName: selectedModelName };
              await transformWithOpenAIStream(prompt, callConfig, onChunk, signal);
          } else {
              throw new Error(`Unknown model selection: ${selectedModel}`);
          }
      } catch (e: any) {
          if (e.name === 'AbortError') {
              transformedContent.textContent = 'Transformation cancelled by user.';
          } else {
              console.error('AI Transformation Error:', e);
              const errorMessage = `An error occurred during transformation. Please check your settings and the console for details.\n\nError: ${e.message}`;
              // Clicking the transform button again will trigger a retry
              showErrorState(errorMessage, () => transformButton.click()); 
          }
      } finally {
          // --- Reset UI to idle state ---
          transformButton.innerHTML = '✨';
          transformButton.setAttribute('aria-label', 'Transform');
          transformButton.style.backgroundColor = ''; // Revert to default
          transformButton.disabled = false;
          prevChapterButton.disabled = currentChapterIndex <= 0;
          nextChapterButton.disabled = currentChapterIndex >= chapters.length - 1;
          currentTransformationController = null;

          if (fullResponse.trim().length > 0) {
              transformedContent.textContent = fullResponse;
              saveSessionState();
          } else if (!firstChunkReceived && !signal.aborted) {
              // Handle case where it finishes with no output at all
              transformedContent.textContent = 'The AI did not return any content. This might be due to content safety filters or an issue with the prompt.';
          }
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