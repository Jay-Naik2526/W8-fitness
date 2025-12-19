const axios = require('axios');
const fs = require('fs');
const path = require('path');

const exercises = require('./data/exercises.json');

const downloadImages = async () => {
    console.log(`>> STARTING SMART SCRAPER: ${exercises.length} items...`);
    
    const imgDir = path.join(__dirname, 'data', 'images');
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        
        // Target paths
        const gifPath = path.join(imgDir, `${ex.id}.gif`);
        const jpgPath = path.join(imgDir, `${ex.id}.jpg`);

        // Skip if we have either
        if (fs.existsSync(gifPath) || fs.existsSync(jpgPath)) {
            successCount++;
            continue;
        }

        // GENERATE NAME VARIATIONS (The Fix)
        const candidates = [];
        
        // 1. Standard Title Case (e.g. "Air_Bike")
        candidates.push(toTitleCase(ex.name)); 
        
        // 2. Handle "45°" -> "45_Degree"
        if (ex.name.includes('°')) {
            candidates.push(toTitleCase(ex.name.replace('°', ' Degree')));
            candidates.push(toTitleCase(ex.name.replace('°', '_Degree')));
        }

        // 3. Handle Brackets (Remove content inside)
        if (ex.name.includes('(')) {
            // "Assisted Chest Dip (Kneeling)" -> "Assisted_Chest_Dip"
            candidates.push(toTitleCase(ex.name.replace(/\(.*\)/, '')));
        }

        // 4. Handle Slashes "3/4" -> "3_4"
        candidates.push(toTitleCase(ex.name.replace('/', '_')));

        // 5. Raw Lowercase (Just in case)
        candidates.push(ex.name.replace(/ /g, '_'));

        let downloaded = false;
        console.log(`[${i+1}/${exercises.length}] Trying variations for: ${ex.name}`);

        // TRY EVERY VARIATION
        for (const name of candidates) {
            if (downloaded) break;
            
            // Clean up name (remove double underscores, trim)
            const cleanName = name.replace(/_+/g, '_').replace(/^_|_$/g, '');
            
            // Try GIF URL
            const gifUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${cleanName}/0.gif`;
            try {
                await downloadFile(gifUrl, gifPath);
                console.log(`   ✅ GIF FOUND: ${cleanName}`);
                downloaded = true;
                break; 
            } catch (e) {}

            // Try JPG URL
            if (!downloaded) {
                const jpgUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${cleanName}/0.jpg`;
                try {
                    await downloadFile(jpgUrl, jpgPath);
                    console.log(`   ⚠️ JPG FOUND: ${cleanName}`);
                    downloaded = true;
                    break;
                } catch (e) {}
            }
        }

        if (downloaded) {
            successCount++;
        } else {
            console.log(`   ❌ FAILED (All variations tried)`);
            failCount++;
        }
    }
    console.log(`\n>> JOB COMPLETE. Success: ${successCount}, Failed: ${failCount}`);
};

// Helper: Formats "air bike" -> "Air_Bike"
function toTitleCase(str) {
    return str
        .replace(/[^\w\s]/g, ' ') // Remove special chars
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('_');
}

// Helper: Download Stream
async function downloadFile(url, savePath) {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
    });
    const writer = fs.createWriteStream(savePath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

downloadImages();