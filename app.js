// Imports removed for non-module compatibility

document.addEventListener('DOMContentLoaded', async () => {
    const fontManager = new FontManager();
    const renderer = new Renderer(fontManager);
    const audioManager = new AudioManager();

    // Initial setup
    await renderer.initialize();

    // Bind UI controls
    document.getElementById('load-fonts-btn').addEventListener('click', () => fontManager.requestLocalFonts());

    document.getElementById('shutter-button').addEventListener('mousedown', () => {
        renderer.triggerShutter();
        audioManager.playShutter();
        document.getElementById('shutter-light').classList.add('on');
    });

    document.getElementById('shutter-button').addEventListener('mouseup', () => {
        document.getElementById('shutter-light').classList.remove('on');
    });

    document.getElementById('export-btn').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'shashoku-output.png';
        link.href = document.getElementById('film-canvas').toDataURL();
        link.click();
    });

    document.getElementById('export-pdf-btn').addEventListener('click', () => {
        const canvas = document.getElementById('film-canvas');
        const imgData = canvas.toDataURL('image/png');

        // Create PDF (A4 default, or match canvas ratio?)
        // Let's assume A4 portrait for simplicity or auto-size.
        // jsPDF units: mm is good.
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'mm'
        });

        // Calculate fit
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfRatio = pdfWidth / pdfHeight;
        const imgRatio = imgProps.width / imgProps.height;

        let w, h;
        if (imgRatio > pdfRatio) {
            w = pdfWidth;
            h = w / imgRatio;
        } else {
            h = pdfHeight;
            w = h * imgRatio;
        }

        pdf.addImage(imgData, 'PNG', 0, 0, w, h);
        pdf.save('shashoku-output.pdf');
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            populatePlate(e.target.dataset.set);
        });
    });

    // Custom Char Adding
    document.getElementById('add-char-btn').addEventListener('click', () => {
        const input = document.getElementById('add-char-text');
        const text = input.value;
        if (!text) return;

        const plate = document.getElementById('main-plate');
        // Retrieve current characters from DOM to avoid duplicate logic or state loss? 
        // Or just append.
        // Let's just append to the current view for simplicity.
        // Ideally we should update the dataset, but for now simple append is fine.

        text.split('').forEach(char => {
            const div = document.createElement('div');
            div.className = 'char-cell';
            div.textContent = char;
            div.onclick = () => {
                document.querySelectorAll('.char-cell').forEach(c => c.classList.remove('active'));
                div.classList.add('active');
                window.dispatchEvent(new CustomEvent('char-selected', { detail: char }));
            };
            plate.insertBefore(div, plate.firstChild); // Add to top
        });

        input.value = '';
    });

    // Initial plate
    populatePlate('hiragana');
});

const CHAR_SETS = {
    'hiragana': 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんぁぃぅぇぉっゃゅょー、。',
    'katakana': 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンァィゥェォッャュョー・',
    'symbols': '！？（）「」『』【】★☆♪〒※→←↑↓ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    'kanji-basic': '一二三四五六七八九十百千万億兆年月日時分秒東西南北上下左右中大小高低新古今未来私你彼彼女父母兄姉弟妹学校会社仕事食事行来帰見聞言読書'
};

function populatePlate(setName) {
    const plate = document.getElementById('main-plate');
    plate.innerHTML = '';

    const chars = CHAR_SETS[setName] || CHAR_SETS['hiragana'];

    chars.split('').forEach(char => {
        const div = document.createElement('div');
        div.className = 'char-cell';
        div.textContent = char;
        div.onclick = () => {
            document.querySelectorAll('.char-cell').forEach(c => c.classList.remove('active'));
            div.classList.add('active');
            window.dispatchEvent(new CustomEvent('char-selected', { detail: char }));
        };
        plate.appendChild(div);
    });
}
