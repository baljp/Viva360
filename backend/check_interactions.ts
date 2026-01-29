
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

// Emails from mockData.service.ts
const ACTORS = {
    seeker: { email: 'seeker0@demo.viva360.com', password: '123456', token: '', id: '' },
    guardian: { email: 'guardian0@demo.viva360.com', password: '123456', token: '', id: '' },
    sanctuary: { email: 'contact@templodaluz.com', password: '123456', token: '', id: '' }
};

async function step(name: string, fn: () => Promise<any>) {
    process.stdout.write(`[...] ${name}`);
    try {
        const res = await fn();
        console.log(`\r[OK ] ${name} - ${JSON.stringify(res).substring(0, 50)}...`);
        return res;
    } catch (e: any) {
        console.log(`\r[ERR] ${name} - ${e.message}`);
        return null; 
    }
}

async function login(actorKey: keyof typeof ACTORS) {
    const actor = ACTORS[actorKey];
    console.log(`\nLogging in ${actorKey}: ${actor.email}...`);
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: actor.email, password: actor.password })
    });
    
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Login failed for ${actor.email}: ${res.status} ${txt}`);
    }
    
    const data = await res.json();
    actor.token = data.session.access_token;
    actor.id = data.user.id;
    return { role: data.user.role, id: actor.id };
}

async function authFetch(actorKey: keyof typeof ACTORS, path: string, options: any = {}) {
    const actor = ACTORS[actorKey];
    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${actor.token}`,
        ...options.headers
    };
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${txt.substring(0, 100)}`);
    }
    return res.json();
}

async function run() {
    console.log("=== CHECKING INTERACTIONS (SEEKER <-> GUARDIAN <-> SANCTUARY) ===");

    // 1. AUTHENTICATE ALL ACTORS
    await step('Login Seeker', () => login('seeker'));
    await step('Login Guardian', () => login('guardian'));
    await step('Login Sanctuary', () => login('sanctuary'));

    if (!ACTORS.seeker.token || !ACTORS.guardian.token || !ACTORS.sanctuary.token) {
        console.error("!!! CRITICAL: One or more actors failed to login. Aborting interactions.");
        process.exit(1);
    }

    console.log(`\n--- IDs: S:${ACTORS.seeker.id} | G:${ACTORS.guardian.id} | Sp:${ACTORS.sanctuary.id} ---\n`);

    // 2. SEEKER -> GUARDIAN (Booking)
    console.log("--- 1. BOOKING FLOW (Seeker books Guardian) ---");
    // Marketplace lists services (Sessão Reiki from mock)
    await step('Seeker lists Services', () => authFetch('seeker', '/marketplace/products?category=service'));
    
    const appointmentData = {
        professional_id: ACTORS.guardian.id, // Current logged in guardian (from Mock Data)
        time: '14:30',
        date: new Date(Date.now() + 86400000).toISOString(),
        service_name: 'Leitura de Aura',
        price: 150
    };

    const booking = await step('Seeker creates Appointment', () => authFetch('seeker', '/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData)
    }));

    if (booking) {
        // Guardian checks appointments
        await step('Guardian views Appointments', async () => {
             const appts = await authFetch('guardian', '/appointments');
             console.log(`\n    (Guardian sees ${appts.length} appointments)`);
             return appts;
        });
    }

    // 3. GUARDIAN -> BAZAR (Listing)
    console.log("\n--- 2. BAZAR FLOW (Guardian Lists, Seeker checks) ---");
    const productData = {
        name: `Cristal Mestre Mock ${Date.now()}`,
        price: 88,
        description: 'Um cristal poderoso para testes.',
        category: 'Insumos',
        type: 'physical',
        karmaReward: 10,
        image: 'https://via.placeholder.com/150'
    };

    const product = await step('Guardian creates Product', () => authFetch('guardian', '/marketplace/products', {
        method: 'POST',
        body: JSON.stringify(productData)
    }));
    
    // Note: Mock marketplace list is static, so we don't expect to see new one,
    // but the CREATE call should succeed (200/201).
    
    await step('Seeker lists All Products', () => authFetch('seeker', '/marketplace/products'));

    // 4. SANCTUARY -> GUARDIAN (Team/Recruitment)
    console.log("\n--- 3. SANCTUARY FLOW (Manage Team & Finance) ---");
    // Check Tribe (Team)
    await step('Sanctuary views Team (Tribe)', () => authFetch('sanctuary', '/tribe/members'));
    
    // Check Finance
    await step('Sanctuary checks Finance', () => authFetch('sanctuary', '/finance/summary'));
    
    // Check Rooms
    await step('Sanctuary checks Rooms', () => authFetch('sanctuary', '/rooms'));

    console.log("\n=== INTERACTIONS COMPLETE ===");
}

run();
