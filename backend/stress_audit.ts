
/**
 * STRESS TEST SCRIPT - VIVA360
 * This script generates 1000 Oracle draws and 100 Evolution entries.
 * Run this in the browser console while the app is open.
 */

const generateStressData = (userId = 'user_123') => {
    console.log("🚀 Starting Stress Test Data Generation...");

    // 1. Generate 1000 Oracle Draws
    const oracleDraws: Record<string, any> = {};
    const moods = ['Sereno', 'Vibrante', 'Melancólico', 'Expansivo'];
    const elements = ['Fogo', 'Agua', 'Terra', 'Ar', 'Eter'];
    
    for (let i = 0; i < 1000; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const key = `${userId}_${dateStr}`;
        
        oracleDraws[key] = {
            id: `card_${i}`,
            insight: `Insight de estresse #${i}: A jornada de mil passos continua.`,
            element: elements[i % elements.length],
            mood: moods[i % moods.length]
        };
    }
    localStorage.setItem('viva360.db.oracle_draws', JSON.stringify(oracleDraws));
    console.log("✅ 1000 Oracle draws generated.");

    // 2. Generate 100 Evolution Entries
    const evolutionHistory = [];
    const images = [
        "https://images.unsplash.com/photo-1518173946687-a4c8892415f4",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        "https://images.unsplash.com/photo-1470252649378-b736a029c69d",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
    ];

    for (let i = 0; i < 100; i++) {
        const date = new Date();
        date.setHours(date.getHours() - (i * 12)); // 2 registros por dia aprox
        
        evolutionHistory.push({
            id: Date.now() - (i * 100000),
            mood: moods[i % moods.length],
            photoThumb: `${images[i % images.length]}?q=80&w=400&auto=format&fit=crop&sig=${i}`,
            quote: `Reflexão da jornada #${100 - i}: Evoluir é um ato de coragem.`,
            ritual: ["Meditação", "Respiração"],
            timestamp: date.toISOString(),
            userId: userId
        });
    }
    localStorage.setItem('viva360.evolution_history', JSON.stringify(evolutionHistory));
    console.log("✅ 100 Evolution entries generated.");

    console.log("✨ Stress Test Data Injection Complete. Please refresh the page.");
};

// Auto-export to window for easy console access
(window as any).runVivaStressTest = generateStressData;
