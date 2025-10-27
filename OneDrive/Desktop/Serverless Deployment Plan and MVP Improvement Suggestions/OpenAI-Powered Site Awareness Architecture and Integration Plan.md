> # OpenAI-Powered Site Awareness Architecture and Integration Plan
> 
> **Date:** October 26, 2025  
> **Author:** Manus AI
> 
> ## 1. Executive Summary
> 
> This document outlines a comprehensive analysis of the **Playwright Tooltip System** and the **Enhanced Tech Support Assistant** Chrome extension. Based on this analysis, it proposes a novel architecture to integrate OpenAI's multimodal AI capabilities, enabling a new feature called **"Site Awareness."** This feature will analyze cached screenshots of web pages to automatically determine a site's focus, capabilities, and the tasks a user is attempting to accomplish. The goal is to create a "page-aware" assistant that provides proactive and contextually relevant support.
> 
> The proposed solution leverages the existing screenshot-caching mechanism of the Playwright Tooltip System and the AI-powered chat interface of the Enhanced Tech Support Assistant. By integrating OpenAI's image analysis, the combined system will be able to "see" and understand the user's current web environment, offering a new level of intelligent assistance.
> 
> ## 2. System Analysis
> 
> ### 2.1. Playwright Tooltip System
> 
> The **Playwright Tooltip System** is a browser extension that provides users with a preview of a hyperlink's destination before they click on it. It works by generating and caching screenshots of web pages, which are then displayed as tooltips.
> 
> **Key Features & Architecture:**
> 
> -   **Screenshot Generation:** A backend service using **Playwright** and **Node.js** captures screenshots of URLs sent by the extension.
> -   **Caching:** Screenshots are cached for a short duration (5 minutes) to provide near-instantaneous previews on subsequent hovers.
> -   **Frontend:** The extension consists of a content script that detects hovers, manages the cache, and displays the tooltips.
> -   **API:** A simple REST API allows the extension to request screenshots (`POST /capture`) and check the backend's health (`GET /health`).
> 
> The critical output of this system, for our purposes, is the **cache of screenshots**, which represents a recent history of the user's browsing interests and the content of the pages they are interacting with.
> 
> ### 2.2. Enhanced Tech Support Assistant
> 
> The **Enhanced Tech Support Assistant** is a separate Chrome extension that provides AI-powered technical assistance. Its primary features are:
> 
> -   **AI Chat:** A chat interface for users to ask technical questions.
> -   **Document Crawling:** The ability to process and understand documentation.
> -   **Intelligent Troubleshooting:** AI-driven guidance for resolving technical issues.
> 
> This extension serves as the user-facing interface for the AI and is the ideal platform for integrating the new "Site Awareness" capabilities.
> 
> ## 3. Proposed Vision: "Site Awareness"
> 
> The core of this proposal is to create a **"page-aware"** system by combining the two extensions and integrating OpenAI. The "Site Awareness" feature will work as follows:
> 
> 1.  The **Playwright Tooltip System** continues to capture and cache screenshots of web pages.
> 2.  The **Enhanced Tech Support Assistant** gains access to this cache of images.
> 3.  When triggered, the assistant sends one or more of these images to an **OpenAI multimodal model** (e.g., GPT-4o) for analysis.
> 4.  OpenAI analyzes the image(s) to understand the **site's focus, its capabilities (e.g., e-commerce, documentation, social media), and what task the user might be trying to accomplish**.
> 5.  The assistant then uses this contextual understanding to provide more accurate, proactive, and relevant support.
> 
> ## 4. OpenAI Configuration and Architecture
> 
> The following architecture details the data flow and OpenAI configuration required to enable "Site Awareness."
> 
> ### 4.1. Data Flow
> 
> ```
> +--------------------------+      +-----------------------------+      +--------------------------+
> | Playwright Tooltip       |      | Enhanced Tech Support       |      | OpenAI (GPT-4o)          |
> | System                   |      | Assistant                   |      |                          |
> +--------------------------+      +-----------------------------+      +--------------------------+
> | 1. Capture & Cache       |----->| 2. Access Image Cache       |      |                          |
> |    Screenshots           |      |                             |      |                          |
> |                          |      | 3. Send Image(s) to OpenAI  |----->| 4. Analyze Image &       |
> |                          |      |    (as base64 data)         |      |    Extract Insights      |
> |                          |      |                             |      |                          |
> |                          |      | 5. Receive Analysis         |<-----|                          |
> |                          |      |                             |      |                          |
> |                          |      | 6. Provide Aware Assistance |      |                          |
> +--------------------------+      +-----------------------------+      +--------------------------+
> ```
> 
> ### 4.2. OpenAI Analysis Process
> 
> The analysis will be conducted in a multi-step process using a single, powerful prompt sent to a multimodal AI model like GPT-4o.
> 
> **Step 1: Image Selection**
> 
> The Enhanced Tech Support Assistant will need a mechanism to select the most relevant image(s) from the cache. This could be the most recent image, a series of recent images, or an image explicitly selected by the user.
> 
> **Step 2: Prompt Engineering**
> 
> A carefully crafted prompt is essential for extracting the desired information. The prompt should instruct the AI to analyze the provided image(s) and return a structured JSON object containing the following fields:
> 
> -   `site_focus`: A brief description of the website's main purpose (e.g., "E-commerce site for electronics," "Developer documentation for a JavaScript library").
> -   `site_capabilities`: A list of key features or actions available on the page (e.g., ["Search for products", "Add items to cart", "Read user reviews"]).
> -   `user_task_hypothesis`: An educated guess about what the user is trying to do, based on the visual evidence (e.g., "The user is likely comparing two different laptop models," "The user is trying to find the installation guide for a software package").
> -   `confidence_score`: A numerical score (0.0 to 1.0) indicating the AI's confidence in its analysis.
> 
> **Example Prompt:**
> 
> ```
> "You are an expert web analyst. Analyze the attached screenshot of a web page and return a JSON object with the following structure:
> 
> {
>   \"site_focus\": \"A brief, one-sentence description of the website's primary purpose.\",
>   \"site_capabilities\": [\"A list of the main actions or features available on the page.\"],
>   \"user_task_hypothesis\": \"Based on the visual evidence, what is the user most likely trying to accomplish?\",
>   \"confidence_score\": \"A float between 0.0 and 1.0 representing your confidence in the analysis.\"
> }
> 
> Analyze the visual elements, text, and overall layout to make your determination."
> ```
> 
> **Step 3: API Call**
> 
> The extension will make a POST request to the OpenAI API, sending the image(s) (as base64-encoded strings) and the prompt.
> 
> ## 5. Implementation Plan and Integration Strategy
> 
> The following is a high-level roadmap for implementing the "Site Awareness" feature.
> 
> ### Phase 1: Bridge the Extensions
> 
> 1.  **Modify the Playwright Tooltip System:** Adjust the caching mechanism to store screenshots in a location accessible to other extensions (e.g., using `chrome.storage.local` or a shared IndexedDB database).
> 2.  **Modify the Enhanced Tech Support Assistant:** Add the necessary permissions and code to read from the shared storage, allowing it to access the cached images.
> 
> ### Phase 2: Implement the OpenAI Integration
> 
> 1.  **Develop the OpenAI Service:** In the Enhanced Tech Support Assistant, create a service that:
>     -   Retrieves the selected image(s) from the shared cache.
>     -   Encodes the image(s) in base64.
>     -   Constructs the prompt as described in section 4.2.
>     -   Makes the API call to OpenAI.
>     -   Parses the JSON response.
> 2.  **Secure API Key Management:** Store the OpenAI API key securely, either in the extension's configuration or by requiring the user to enter it.
> 
> ### Phase 3: Enhance the UI/UX
> 
> 1.  **Add a "Site Awareness" Trigger:** Add a button or command to the Enhanced Tech Support Assistant's UI that allows the user to trigger the analysis.
> 2.  **Display the Analysis:** Present the results of the analysis to the user in a clear and understandable way. For example, the assistant could start its response with, "It looks like you're on a documentation page for a Python library. What can I help you with?"
> 3.  **Proactive Assistance:** For a more advanced implementation, the analysis could be triggered automatically when the user opens the assistant, providing immediate, context-aware support.
> 
> ## 6. Conclusion
> 
> By integrating the Playwright Tooltip System, the Enhanced Tech Support Assistant, and OpenAI, we can create a powerful new tool that is "aware" of the user's context. This "Site Awareness" will enable the assistant to provide more accurate, relevant, and proactive support, significantly enhancing the user experience. The proposed architecture is designed to be modular and scalable, allowing for future enhancements and a deeper integration of AI into the user's browsing experience.
> 
> ### References
> 
> [1] **mcpmessenger/tooltip-playwright GitHub Repository:** [https://github.com/mcpmessenger/tooltip-playwright](https://github.com/mcpmessenger/tooltip-playwright)
> 
> [2] **Enhanced Tech Support Assistant Chrome Web Store Page:** [https://chromewebstore.google.com/detail/mlphakpkofdcigfpcpmgomhgalodhlkm](https://chromewebstore.google.com/detail/mlphakpkofdcigfpcpmgomhgalodhlkm)

