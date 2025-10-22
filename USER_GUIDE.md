# AI Content Transformer User Guide

This guide will walk you through how to use the AI Content Transformer to load, navigate, and transform text files using the power of AI.

---

## English Guide

### 1. Overview

The AI Content Transformer is a tool designed to help you rewrite or restyle text content from `.txt` files. It automatically splits your document into chapters, allows you to configure different AI models (like Google's Gemini or any OpenAI-compatible API), and transforms the text based on your custom instructions.

### 2. Getting Started

Follow these simple steps to transform your first document.

#### Step 1: Configure Your AI Model (Important!)

Before you can transform content, you must configure an AI model.

1.  Click the **Settings** icon (⚙️) in the top-right corner.
2.  The settings panel has three sections:
    *   **Style & Prompt**: Define the writing style and the instruction template for the AI.
        *   **Writer Style**: Enter the desired style (e.g., `Ernest Hemingway`, `a professional business writer`, `a friendly blogger`).
        *   **Custom AI Prompt**: This is the template for the AI's instructions. Use the placeholders `{writerStyle}` and `{originalText}` which will be automatically replaced with your chosen style and the chapter's content.
    *   **Google Gemini**:
        *   **Model Name**: The name of the Gemini model to use (e.g., `gemini-2.5-flash`).
        *   **API Key**: Your Google AI API key. If you leave this blank, the application will try to use a pre-configured key from the environment.
    *   **OpenAI Compatible Models**:
        *   If you use a local model (like Llama) or another service with an OpenAI-compatible API, click **Add New Model**.
        *   Fill in the details:
            *   **Display Name**: A name for this service (e.g., `My Local AI`).
            *   **API Base URL**: The endpoint for the service.
            *   **Model Names**: Enter the specific model IDs you want to use from this service, with **each model on a new line**. For example:
                ```
                llama3-70b-instruct
                gemma-7b-it
                ```
            *   **API Key**: The API key for the service.
3.  Click **Save & Close** when you are done.

#### Step 2: Choose a File

1.  On the main screen, you can select the character **File Encoding** for your `.txt` file. **Auto-detect** is recommended and works for most files.
2.  Click the **Choose a File** button and select a `.txt` file from your device.

#### Step 3: Navigate Your Content

Once the file is loaded:

*   A **Table of Contents** will appear on the left (on desktop) or can be accessed via the menu button (☰) on mobile.
*   Click any chapter title in the list to view its content in the main panel.

#### Step 4: Transform a Chapter

1.  Click the **Magic Wand** icon (🪄) in the bottom-right to open the Floating Action Button (FAB) menu.
2.  The menu contains three buttons:
    *   **Previous Chapter** (←)
    *   **Transform** (✨)
    *   **Next Chapter** (→)
3.  Click the **Transform** (✨) button. The application will send the current chapter's text and your custom prompt to the selected AI model.
4.  The view will automatically switch to the **Transformed Chapter** tab, where you will see the AI-generated text.

#### Step 5: View and Compare

*   You can switch between the **Original Chapter** and **Transformed Chapter** tabs to compare the results.
*   Your transformed content is saved for the current session, so you can navigate to other chapters and come back without losing it.
*   To close the current file and start over, click the close icon (×) in the header.

### 3. Key Features

*   **Model Selection**: Easily switch between your configured models using the dropdown menu in the header. If you've configured an OpenAI-compatible service with multiple model names, they will appear grouped under the service's display name in the dropdown for easy selection.
*   **Session Persistence**: The app remembers your loaded file, current chapter, and transformed text. If you close and reopen the browser tab, you can continue where you left off.
*   **Responsive Design**: The interface adapts smoothly for use on both desktop and mobile devices.

---

## 中文指南

### 1. 概述

AI 内容转换器是一款强大的工具，旨在帮助您重写或重塑 `.txt` 文件的文本内容。它能自动将您的文档拆分为章节，允许您配置不同的 AI 模型（如谷歌的 Gemini 或任何与 OpenAI 兼容的 API），并根据您的自定义指令对文本进行转换。

### 2. 快速上手

请按照以下简单步骤来转换您的第一个文档。

#### 第一步：配置您的 AI 模型（重要！）

在进行内容转换之前，您必须首先配置一个 AI 模型。

1.  点击右上角的 **设置** 图标 (⚙️)。
2.  设置面板包含三个部分：
    *   **风格与提示词 (Style & Prompt)**：定义 AI 的写作风格和指令模板。
        *   **Writer Style (作者风格)**：输入您期望的风格（例如：`海明威`、`专业的商业文案写手`、`一位友好的博主`）。
        *   **Custom AI Prompt (自定义 AI 提示词)**：这是发送给 AI 的指令模板。请使用占位符 `{writerStyle}` 和 `{originalText}`，它们将被自动替换为您选择的风格和当前章节的内容。
    *   **Google Gemini**:
        *   **Model Name (模型名称)**：要使用的 Gemini 模型名称（例如 `gemini-2.5-flash`）。
        *   **API Key (API 密钥)**：您的 Google AI API 密钥。如果留空，应用将尝试使用环境中预设的密钥。
    *   **OpenAI 兼容模型 (OpenAI Compatible Models)**：
        *   如果您使用本地模型（如 Llama）或其他提供 OpenAI 兼容 API 的服务，请点击 **Add New Model (添加新模型)**。
        *   填写详细信息:
            *   **Display Name (显示名称)**: 为此服务命名 (例如: `我的本地AI`)。
            *   **API Base URL (API基础URL)**: 服务的接口地址。
            *   **Model Names (模型名称)**: 输入您想从该服务使用的具体模型ID，**每个模型占一行**。例如:
                ```
                llama3-70b-instruct
                gemma-7b-it
                ```
            *   **API Key (API密钥)**: 服务的API密钥。
3.  完成后，点击 **Save & Close (保存并关闭)**。

#### 第二步：选择文件

1.  在主屏幕上，您可以为您的 `.txt` 文件选择 **File Encoding (文件编码)**。推荐使用 **Auto-detect (自动检测)**，它适用于大多数文件。
2.  点击 **Choose a File (选择文件)** 按钮，从您的设备中选择一个 `.txt` 文件。

#### 第三步：浏览内容

文件加载后：

*   屏幕左侧将出现 **Table of Contents (目录)**（桌面版），在移动设备上则可通过菜单按钮 (☰) 访问。
*   点击目录中的任何章节标题，即可在主面板中查看其内容。

#### 第四步：转换章节

1.  点击右下角的 **魔法棒** 图标 (🪄) 以打开悬浮操作按钮 (FAB) 菜单。
2.  菜单包含三个按钮：
    *   **上一章 (Previous Chapter)** (←)
    *   **转换 (Transform)** (✨)
    *   **下一章 (Next Chapter)** (→)
3.  点击 **转换 (Transform)** (✨) 按钮。应用程序会将当前章节的文本和您的自定义提示词发送给选定的 AI 模型。
4.  视图将自动切换到 **Transformed Chapter (转换后章节)** 标签页，您将在那里看到 AI 生成的文本。

#### 第五步：查看与比较

*   您可以在 **Original Chapter (原始章节)** 和 **Transformed Chapter (转换后章节)** 标签页之间切换，以比较结果。
*   您转换过的内容会在当前会话中被保存，因此您可以浏览其他章节后再返回，而不会丢失已生成的内容。
*   要关闭当前文件并重新开始，请点击标题栏中的关闭图标 (×)。

### 3. 主要功能

*   **模型选择 (Model Selection)**：使用标题栏中的下拉菜单，轻松在已配置的模型之间切换。如果您为一个 OpenAI 兼容服务配置了多个模型名称，它们将在下拉菜单中以该服务的显示名称分组，方便您进行选择。
*   **会话保持 (Session Persistence)**：应用会记住您加载的文件、当前章节和已转换的文本。即使您关闭并重新打开浏览器标签页，也能从上次离开的地方继续。
*   **响应式设计 (Responsive Design)**：界面能够流畅地适应桌面和移动设备的使用。增强模型输入，支持同一个服务商多个模型id的输入，同时在模型选择上也优化一下对应的显示
