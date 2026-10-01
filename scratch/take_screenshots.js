const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    const outDir = path.resolve(__dirname, '..', 'assets', 'screenshots');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto('https://cakekulator-bd.web.app', { waitUntil: 'networkidle2' });

    // 1. Dashboard
    await page.screenshot({ path: path.join(outDir, 'screenshot-1-dashboard.png') });
    console.log('Saved screenshot 1');

    // 2. Click Recetas
    try {
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('button, a, nav *'));
            const recTab = tabs.find(el => el.textContent && el.textContent.includes('Recetas'));
            if (recTab) recTab.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: path.join(outDir, 'screenshot-2-recetas.png') });
        console.log('Saved screenshot 2');
    } catch(e) { console.error(e); }

    // 3. Open Nueva Receta Modal
    try {
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const newBtn = btns.find(b => b.textContent && b.textContent.includes('Nueva Receta'));
            if (newBtn) newBtn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: path.join(outDir, 'screenshot-3-nueva-receta.png') });
        console.log('Saved screenshot 3');

        // Close modal
        await page.evaluate(() => {
            const closeBtn = document.querySelector('.modal-close, button.close, [aria-label="Cerrar"], .btn-secondary');
            if (closeBtn) closeBtn.click();
        });
        await new Promise(r => setTimeout(r, 500));
    } catch(e) { console.error(e); }

    // 4. Insumos Tab
    try {
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('button, a, nav *'));
            const insTab = tabs.find(el => el.textContent && el.textContent.includes('Insumos'));
            if (insTab) insTab.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: path.join(outDir, 'screenshot-4-insumos.png') });
        console.log('Saved screenshot 4');
    } catch(e) { console.error(e); }

    // 5. Costos Fijos Tab
    try {
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('button, a, nav *'));
            const cfTab = tabs.find(el => el.textContent && (el.textContent.includes('Costos') || el.textContent.includes('Fijos')));
            if (cfTab) cfTab.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: path.join(outDir, 'screenshot-5-costos-fijos.png') });
        console.log('Saved screenshot 5');
    } catch(e) { console.error(e); }

    // 6. Cotizaciones / Cotizador Tab
    try {
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('button, a, nav *'));
            const cotTab = tabs.find(el => el.textContent && el.textContent.includes('Cotiz'));
            if (cotTab) cotTab.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: path.join(outDir, 'screenshot-6-cotizador.png') });
        console.log('Saved screenshot 6');
    } catch(e) { console.error(e); }

    // 7. Porciones / Conversor / Moldes Tab
    try {
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('button, a, nav *'));
            const molTab = tabs.find(el => el.textContent && (el.textContent.includes('Molde') || el.textContent.includes('Porcion') || el.textContent.includes('Conv')));
            if (molTab) molTab.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: path.join(outDir, 'screenshot-7-herramientas.png') });
        console.log('Saved screenshot 7');
    } catch(e) { console.error(e); }

    // 8. Ajustes / Configuración Tab
    try {
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('button, a, nav *'));
            const confTab = tabs.find(el => el.textContent && (el.textContent.includes('Ajuste') || el.textContent.includes('Config') || el.textContent.includes('Perfil')));
            if (confTab) confTab.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: path.join(outDir, 'screenshot-8-ajustes.png') });
        console.log('Saved screenshot 8');
    } catch(e) { console.error(e); }

    await browser.close();
    console.log('ALL SCREENSHOTS COMPLETED');
})();
