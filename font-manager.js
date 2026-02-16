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
            const blob = await fontData.blob();
            // Create a custom font face
            const fontName = `ShashokuFont_${Date.now()}`;
            const fontFace = new FontFace(fontName, blob);

            await fontFace.load();
            document.fonts.add(fontFace);

            this.selectedFontData = fontData;
            this.loadedFontFace = fontName; // Use this family name in canvas

            console.log(`Font loaded: ${fontData.fullName} as ${fontName}`);

            // Update UI or notify renderer
            return fontName;
        } catch (err) {
            console.error('Failed to load font blob:', err);
            throw err;
        }
    }

    showFontPicker() {
        // Create a simple modal or populate a select element
        // Ideally this should be in UI code, but for speed we do it here or dispatch event.
        // Let's create a temporary select overlay.
        let picker = document.getElementById('font-picker-overlay');
        if (!picker) {
            picker = document.createElement('div');
            picker.id = 'font-picker-overlay';
            picker.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); z-index: 1000;
                display: flex; justify-content: center; align-items: center;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background: #333; padding: 20px; border-radius: 8px;
                width: 80%; max-height: 80%; display: flex; flex-direction: column;
            `;

            const list = document.createElement('select');
            list.id = 'font-picker-select';
            list.size = 20; // Show multiple items
            list.style.cssText = `
                flex: 1; background: #222; color: #fff; border: 1px solid #555;
                font-size: 16px; padding: 10px; margin-bottom: 10px;
            `;

            const btnContainer = document.createElement('div');
            btnContainer.style.textAlign = 'right';

            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Select & Close';
            closeBtn.onclick = async () => {
                const selectedIndex = list.selectedIndex;
                if (selectedIndex >= 0) {
                    const font = this.fonts[selectedIndex];
                    await this.loadFont(font);
                    document.body.removeChild(picker);
                }
            };

            btnContainer.appendChild(closeBtn);
            content.appendChild(list);
            content.appendChild(btnContainer);
            picker.appendChild(content);
            document.body.appendChild(picker);
        }

        const list = document.getElementById('font-picker-select');
        list.innerHTML = '';
        this.fonts.forEach((f, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = f.fullName;
            list.appendChild(opt);
        });
    }

    get currentFontFamily() {
        return this.loadedFontFace || 'sans-serif';
    }
}
