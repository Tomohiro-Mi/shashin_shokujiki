class Renderer {
    constructor(fontManager) {
        this.fontManager = fontManager;
        this.canvas = document.getElementById('film-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Machine state
        this.cursorX = 50; // Initial position on paper (logical coords)
        this.cursorY = 50;
        this.fontSizeQ = 20; // Default Q
        this.charSpacingH = 0; // H (Hamax)
        this.lineSpacingH = 20; // H (Hamax)
        this.unitSystem = 'Q'; // Q or pt
        this.selectedChar = null;

        // Constants
        this.DPI_SCALE = 2; // For Retina display
        this.MM_PER_Q = 0.25;
        this.PT_PER_MM = 2.83465;

        // Bind events
        window.addEventListener('char-selected', (e) => {
            this.selectedChar = e.detail;
            console.log('Selected:', this.selectedChar);
        });

        // Settings Listeners
        document.getElementById('font-size-select').addEventListener('change', (e) => {
            this.fontSizeQ = parseInt(e.target.value, 10);
            console.log('Font Size:', this.fontSizeQ);
        });

        document.getElementById('char-spacing').addEventListener('input', (e) => {
            this.charSpacingH = parseInt(e.target.value, 10);
            document.getElementById('char-spacing-val').textContent = `${this.charSpacingH}H`;
        });

        document.getElementById('line-spacing').addEventListener('input', (e) => {
            this.lineSpacingH = parseInt(e.target.value, 10);
            document.getElementById('line-spacing-val').textContent = `${this.lineSpacingH}H`;
        });

        document.getElementById('clear-btn').addEventListener('click', () => this.clearCanvas());

        // Setup resize observer for canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    async initialize() {
        // Prepare effects pipeline
        // Could load noise textures here
    }

    resizeCanvas() {
        // Make canvas match the viewport size, but internally high-res
        const viewport = document.getElementById('paper-viewport');
        const rect = viewport.getBoundingClientRect();

        // We want a fixed "paper size" internally, or dynamic?
        // Let's stick to the viewport size * scale for now
        this.canvas.width = rect.width * this.DPI_SCALE;
        this.canvas.height = rect.height * this.DPI_SCALE;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        this.ctx.scale(this.DPI_SCALE, this.DPI_SCALE);

        // Initial blank paper
        this.clearCanvas();
    }

    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width / this.DPI_SCALE, this.canvas.height / this.DPI_SCALE);
        // Reset Cursor
        this.cursorX = 50;
        this.cursorY = 50 + this.qToPx(this.fontSizeQ); // Baselineish
    }

    // Helper: Convert Q unit to Pixels (Screen approx)
    // 1Q = 0.25mm
    // Assume screen is 96dpi for logic (1px = 0.26mm). So 1Q ~= 1px is close enough for simulation?
    // Let's be slightly more precise: 1mm ~ 3.78px (css pixel).
    // 1Q = 0.25mm * 3.78 = 0.945px.
    qToPx(q) {
        return q * 0.945;
    }

    triggerShutter() {
        if (!this.selectedChar) return;

        // 1. Setup Font
        const fontFamily = this.fontManager.currentFontFamily;
        const fontSizePx = this.qToPx(this.fontSizeQ);

        // Analog Effect Settings
        // Blur simulates the optical lens softness
        // Contrast simulates the high-contrast film development which sharpens/rounds edges
        // We can use context filter for this.
        // For a subtle "ink spread", we can draw slightly larger with blur, then cut with contrast.

        this.ctx.save();

        // Visual Style: Soft analog edges
        // 0.8px blur + high contrast creates the rounded corner "phototype" look
        this.ctx.filter = 'blur(0.8px) contrast(200%)';

        this.ctx.fillStyle = '#111'; // Not pure black, bit of ink fade? No, film is usually high density.
        this.ctx.fillStyle = '#000';

        this.ctx.font = `${fontSizePx}px "${fontFamily}"`;
        this.ctx.textBaseline = 'bottom';

        // 2. Draw the character (Base layer)
        // Add slight jitter for mechanical inaccuracy
        const jitterX = (Math.random() - 0.5) * 0.2;
        const jitterY = (Math.random() - 0.5) * 0.2;

        this.ctx.fillText(this.selectedChar, this.cursorX + jitterX, this.cursorY + jitterY);

        this.ctx.restore(); // Reset filter for next operations if any

        // 3. Move Cursor (Advance)
        // Shashoku is typically monospaced frame-based.
        // If 20Q, character frame is 20Q wide.
        const charFrameWidth = fontSizePx;

        // Spacing: H (Ha) = 0.25mm = 1Q. 
        const spacingPx = this.qToPx(this.charSpacingH);

        this.cursorX += charFrameWidth + spacingPx;

        // Wrap line if needed
        const viewportWidth = this.canvas.width / this.DPI_SCALE;
        if (this.cursorX > viewportWidth - 50) {
            this.newline();
        }
    }

    newline() {
        this.cursorX = 50;
        // Line Feed
        const fontSizePx = this.qToPx(this.fontSizeQ);
        const lineSpacingPx = this.qToPx(this.lineSpacingH);
        this.cursorY += fontSizePx + lineSpacingPx;
    }
}
