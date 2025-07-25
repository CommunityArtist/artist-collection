const initialFormData: PromptBuilderData = {
  subjectAndSetting: (urlParams.get('subject') || '') + (urlParams.get('setting') ? ` in ${urlParams.get('setting')}` : ''),
  lighting: urlParams.get('lighting') || '',
  artStyle: urlParams.get('style') || '',
  mood: urlParams.get('mood') || '',

const autoResize = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = 'auto';
  const newHeight = Math.min(Math.max(textarea.scrollHeight, 120), 400);
  textarea.style.height = newHeight + 'px';
};

      // Fallback to local generation if no API key
      const parts = [];
      
      if (formData.subjectAndSetting) parts.push(formData.subjectAndSetting);
      if (formData.lighting) parts.push(`${formData.lighting} lighting`);
      if (formData.artStyle) parts.push(`${formData.artStyle} style`);
      if (formData.mood) parts.push(`${formData.mood} mood`);

    // Create a comprehensive prompt object
    const promptData = {
      title: formData.subjectAndSetting ? formData.subjectAndSetting.slice(0, 50) + (formData.subjectAndSetting.length > 50 ? '...' : '') : 'Generated Prompt',
      description: `AI-generated prompt featuring ${formData.subjectAndSetting ? formData.subjectAndSetting.slice(0, 100) + (formData.subjectAndSetting.length > 100 ? '...' : '') : 'custom content'}`,
      content: generatedPrompt,

      mood: formData.mood || '',
      lighting: formData.lighting || '',
      subjectAndSetting: formData.subjectAndSetting || '',
      enhancement_codes: formData.enhancementCodes || [],

              <div className="space-y-6">
                <div>
                  <label htmlFor="subjectAndSetting" className="block text-sm font-medium text-gray-300 mb-3">
                    Subject & Setting Description
                  </label>
                  <div className="relative">
                    <textarea
                      id="subjectAndSetting"
                      value={formData.subjectAndSetting}
                      onChange={(e) => {
                        handleInputChange('subjectAndSetting', e.target.value);
                        setTimeout(() => autoResize(e.target), 0);
                      }}
                      onInput={(e) => {
                        autoResize(e.target as HTMLTextAreaElement);
                      }}
                      placeholder="Describe your subject and setting in detail. For example: 'A majestic dragon with iridescent scales soaring through a misty mountain valley at sunset, ancient castle ruins visible in the distance, surrounded by floating magical crystals and ethereal light beams piercing through storm clouds'"
                      maxLength={30000}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
                      style={{ minHeight: '120px', maxHeight: '400px' }}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-gray-800/80 px-2 py-1 rounded">
                      {formData.subjectAndSetting.length}/30,000
                    </div>
                  </div>
                </div>