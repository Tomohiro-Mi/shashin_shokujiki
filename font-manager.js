class FontManager {
    constructor() {
        this.fonts = [];
        this.selectedFontData = null; // The FontData object from the API
        this.loadedFontFace = null;   // The loaded FontFace object
    }

    async requestLocalFonts() {
        if (!('queryLocalFonts' in window)) {
            alert('Your browser does not support the Local Font Access API. Please use Chrome or Edge.');
            return;
        }

        try {
            // Request permission and get available fonts
            const availableFonts = await window.queryLocalFonts();

            // Filter: Prefer Japanese fonts if possible, or just sort alphabetically
            // Simple heuristic to detect likely Japanese fonts:
            // Check if name contains specific keywords or if we can prompt user.
            // For now, simple sort.
            this.fonts = availableFonts.sort((a, b) => a.fullName.localeCompare(b.fullName));

            console.log(`Loaded ${this.fonts.length} fonts.`);

            // Dispatch event to UI to populate a selector (if we had one)
            // For this prototype, we'll just pick a default or show a simple picker
            this.showFontPicker();

        } catch (err) {
            console.error('Error accessing local fonts:', err);
            // Fallback: Create a file input for manual upload
            if (confirm('Local Font Access failed or was denied. Would you like to upload a font file (.ttf/.otf) manually?')) {
                this.triggerManualUpload();
            }
        }
    }

    triggerManualUpload() {
        let input = document.getElementById('font-file-input');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.id = 'font-file-input';
            input.accept = '.ttf,.otf,.woff,.woff2';
            input.style.display = 'none';
            input.onchange = (e) => this.handleFileUpload(e);
            document.body.appendChild(input);
        }
        input.click();
    }

    async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const buffer = await file.arrayBuffer();
            const fontName = `ManualFont_${Date.now()}`;
            const fontFace = new FontFace(fontName, buffer);

            await fontFace.load();
            document.fonts.add(fontFace);

            this.loadedFontFace = fontName;
            this.selectedFontData = { fullName: file.name }; // Mock data

            alert(`Loaded font: ${file.name}`);
            console.log(`Manually loaded ${file.name}`);
        } catch (err) {
            alert('Failed to load font file.');
            console.error(err);
        }
    }

    async loadFont(fontData) {
        try {
            // Try explicit blob loading first (best for accurate rendering/metrics if needed)
            const blob = await fontData.blob();
            const fontName = `ShashokuFont_${Date.now()}`;
            const fontFace = new FontFace(fontName, blob);

            await fontFace.load();
            document.fonts.add(fontFace);

            this.loadedFontFace = fontName;
            this.selectedFontData = fontData;
            console.log(`Font loaded via Blob: ${fontName}`);

            // Apply to UI
            document.documentElement.style.setProperty('--app-font', fontName);

            return fontName;
        } catch (err) {
            console.warn('Blob load failed, falling back to local name:', err);

            // Fallback: Just use the PostScript name or unique name
            // Note: This relies on the browser caching the permission or the name being accessible.
            const nameToUse = fontData.postscriptName || fontData.fullName;
            this.loadedFontFace = nameToUse;
            this.selectedFontData = fontData;

            // Apply to UI
            document.documentElement.style.setProperty('--app-font', nameToUse);

            // We can't verify load easily here, so we assume success
            console.log(`Font set to System Name: ${nameToUse}`);
            return nameToUse;
        }
    }

    showFontPicker() {
        // Create a simple modal or populate a select element
        let picker = document.getElementById('font-picker-overlay');
        if (picker) {
            document.body.removeChild(picker); // Reset if exists
        }

        picker = document.createElement('div');
        picker.id = 'font-picker-overlay';
        picker.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 1000;
            display: flex; justify-content: center; align-items: center;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: #2b2b2b; padding: 20px; border-radius: 8px; border: 1px solid #444;
            width: 80%; max-width: 500px; max-height: 80%; display: flex; flex-direction: column;
            color: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        `;

        const title = document.createElement('h3');
        title.textContent = 'Select System Font';
        title.style.margin = '0 0 15px 0';
        title.style.fontSize = '16px';

        const list = document.createElement('select');
        list.id = 'font-picker-select';
        list.size = 15;
        list.style.cssText = `
            flex: 1; background: #1a1a1a; color: #fff; border: 1px solid #555;
            font-size: 14px; padding: 10px; margin-bottom: 20px; outline: none;
            overflow-y: auto;
        `;

        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.justifyContent = 'flex-end';
        btnContainer.style.gap = '10px';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => document.body.removeChild(picker);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Select Font';
        closeBtn.style.backgroundColor = '#cc0000';
        closeBtn.style.color = '#fff';
        closeBtn.style.border = 'none';

        const selectFont = async () => {
            const selectedIndex = list.selectedIndex;
            if (selectedIndex < 0) {
                alert('Please click on a font name to select it.');
                return;
            }

            const font = this.fonts[selectedIndex];
            closeBtn.textContent = 'Loading...';
            closeBtn.disabled = true;

            try {
                await this.loadFont(font);
                document.body.removeChild(picker);
                // alert(`Switched to: ${font.fullName}`);
            } catch (err) {
                console.error('Final Font Load Error:', err);
                alert('Error loading font: ' + err.message);
                closeBtn.textContent = 'Select Font';
                closeBtn.disabled = false;
            }
        };

        closeBtn.onclick = selectFont;
        list.ondblclick = selectFont;

        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(closeBtn);
        content.appendChild(title);
        content.appendChild(list);
        content.appendChild(btnContainer);
        picker.appendChild(content);
        document.body.appendChild(picker);

        this.fonts.forEach((f, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            // Show localized name if available? fullName is usually best
            opt.textContent = f.fullName;
            list.appendChild(opt);
        });
    }

    get currentFontFamily() {
        return this.loadedFontFace || 'sans-serif';
    }
}
