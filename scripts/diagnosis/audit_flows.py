#!/usr/bin/env python3
"""
Viva360 Full App Audit – Buttons, Screens, Flows & Interconnections
"""
import os, re, json
from pathlib import Path
from collections import defaultdict

BASE = Path("/Users/joaobatistaramalhodelima/Viva360")
VIEWS = BASE / "views"
COMPONENTS = BASE / "components"
SRC = BASE / "src"

results = {
    "placeholder_screens": [],
    "buttons_without_function": [],
    "static_text_placeholders": [],
    "missing_screen_mappings": [],
    "orphan_states": [],
    "dead_buttons": [],
    "gamification_issues": [],
    "checkout_issues": [],
    "interconnection_gaps": [],
}

# Patterns to detect placeholder/unfinished content
PLACEHOLDER_PATTERNS = [
    r'neste\s+local\s+abriria',
    r'aqui\s+abriria',
    r'em\s+breve',
    r'coming\s+soon',
    r'TODO',
    r'FIXME',
    r'PLACEHOLDER',
    r'placeholder',
    r'Em\s+construção',
    r'under\s+construction',
    r'funcionalidade\s+em\s+desenvolvimento',
    r'será\s+implementad',
    r'não\s+implementad',
    r'implementar\s+depois',
    r'tela\s+para\s+fazer\s+isso',
    r'futuramente',
    r'fase\s+2',
    r'v2\.0',
    r'mock\s+data',  # May indicate static screens
]

# Patterns for buttons without real handlers
DEAD_BUTTON_PATTERNS = [
    r'onClick=\{?\s*\(\)\s*=>\s*\{\s*\}\s*\}?',  # onClick={() => {}}
    r'onClick=\{?\s*\(\)\s*=>\s*null\s*\}?',       # onClick={() => null}
    r'onClick=\{?\s*\(\)\s*=>\s*undefined\s*\}?',
    r'onClick=\{?\s*\(\)\s*=>\s*console\.log',      # console.log only
    r'onClick=\{?\s*\(\)\s*=>\s*alert\(',           # alert only
    r'disabled\s*=\s*\{?\s*true\s*\}?',             # permanently disabled
]

# Patterns for static/non-functional screens
STATIC_SCREEN_PATTERNS = [
    r'Simulação\s+visual',
    r'dados?\s+simulados?',
    r'hardcoded',
    r'fake\s+data',
    r'sample\s+data',
    r'dummy',
]

def scan_files(directory):
    files = []
    for root, _, filenames in os.walk(directory):
        if 'node_modules' in root or '.git' in root:
            continue
        for f in filenames:
            if f.endswith(('.tsx', '.ts', '.jsx', '.js')) and not f.endswith('.test.ts'):
                files.append(Path(root) / f)
    return files


# ─── SCAN ALL VIEW FILES ───
all_files = scan_files(VIEWS) + scan_files(COMPONENTS) + scan_files(SRC)
print(f"📁 Total files to audit: {len(all_files)}")

file_contents = {}
for f in all_files:
    try:
        content = f.read_text(encoding='utf-8', errors='ignore')
        file_contents[str(f)] = content
    except:
        pass

print(f"📄 Files read successfully: {len(file_contents)}")

# ─── AUDIT 1: Placeholder/Unfinished Content ───
print("\n" + "="*80)
print("🔍 AUDIT 1: Placeholder & Unfinished Content")
print("="*80)
placeholder_count = 0
for filepath, content in file_contents.items():
    rel = str(Path(filepath).relative_to(BASE))
    lines = content.split('\n')
    for i, line in enumerate(lines, 1):
        # Skip comments and imports
        stripped = line.strip()
        if stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('import'):
            continue
        for pattern in PLACEHOLDER_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                # Exclude test files and scripts
                if '/tests/' in rel or '/scripts/' in rel or '/qa/' in rel:
                    continue
                results["placeholder_screens"].append({
                    "file": rel,
                    "line": i,
                    "match": pattern,
                    "text": stripped[:120]
                })
                placeholder_count += 1
                break

print(f"  Found {placeholder_count} potential placeholders")
for item in results["placeholder_screens"][:30]:
    print(f"  ⚠️  {item['file']}:{item['line']} → {item['text'][:80]}")

# ─── AUDIT 2: Buttons Without Function ───
print("\n" + "="*80)
print("🔍 AUDIT 2: Buttons Without Real Handlers (Dead Buttons)")
print("="*80)
dead_count = 0
for filepath, content in file_contents.items():
    rel = str(Path(filepath).relative_to(BASE))
    if '/tests/' in rel or '/scripts/' in rel:
        continue
    lines = content.split('\n')
    for i, line in enumerate(lines, 1):
        for pattern in DEAD_BUTTON_PATTERNS:
            if re.search(pattern, line):
                # Check it's actually a button or clickable element
                context = '\n'.join(lines[max(0,i-3):i+1])
                if '<button' in context.lower() or 'onclick' in context.lower():
                    results["dead_buttons"].append({
                        "file": rel,
                        "line": i,
                        "pattern": pattern,
                        "text": line.strip()[:120]
                    })
                    dead_count += 1
                break

print(f"  Found {dead_count} potential dead buttons")
for item in results["dead_buttons"][:20]:
    print(f"  🔴 {item['file']}:{item['line']} → {item['text'][:80]}")

# ─── AUDIT 3: Screen Map Coverage ───
print("\n" + "="*80)
print("🔍 AUDIT 3: Screen Map Coverage (Flow States vs Screens)")
print("="*80)

# Define all expected states per profile
buscador_states = [
    'START','DASHBOARD','ORACLE_PORTAL','ORACLE_SHUFFLE','ORACLE_REVEAL',
    'METAMORPHOSIS_CHECKIN','METAMORPHOSIS_CAMERA','METAMORPHOSIS_MESSAGE',
    'METAMORPHOSIS_RITUAL','METAMORPHOSIS_FEEDBACK','TRIBE_DASH','TRIBE_INVITE',
    'TRIBE_INTERACTION','HEALING_CIRCLE','BOOKING_SEARCH','BOOKING_SELECT',
    'BOOKING_CONFIRM','CHECKOUT','PAYMENT_SUCCESS','HISTORY','PAYMENT_HISTORY',
    'CHAT_LIST','CHAT_ROOM','CHAT_SETTINGS','CHAT_NEW','GARDEN_VIEW','EVOLUTION',
    'EVOLUTION_ANALYTICS','EVOLUTION_ACHIEVEMENTS','EVOLUTION_HISTORY',
    'EVOLUTION_TIMELAPSE','TIME_LAPSE_EXPERIENCE','CLIENT_QUESTS','SETTINGS',
    'MARKETPLACE','KARMA_WALLET','ORACLE_HISTORY','EVO_GRIMOIRE','CLIENT_JOURNAL',
    'SOUL_PACT','OFFLINE_RETREAT','END'
]

guardiao_states = [
    'START','DASHBOARD','AGENDA_VIEW','AGENDA_CONFIRM','AGENDA_EDIT','VIDEO_SESSION',
    'PATIENTS_LIST','PATIENT_PROFILE','PATIENT_RECORDS','PATIENT_PLAN',
    'FINANCE_OVERVIEW','FINANCE_DETAILS','FINANCIAL_DASHBOARD','TRIBE_PRO',
    'TRIBE_CHAT','CHAT_LIST','CHAT_ROOM','ESCAMBO_MARKET','ESCAMBO_PROPOSE',
    'ESCAMBO_TRADE','ESCAMBO_CONFIRM','VAGAS_LIST','VAGA_DETAILS','VAGA_APPLY',
    'SANTUARIO_LIST','SANTUARIO_PROFILE','SANTUARIO_CONTRACT','SETTINGS',
    'VIDEO_PREP','CUSTOM_INTERVENTION','ALQUIMIA_CREATE','END'
]

santuario_states = [
    'START','EXEC_DASHBOARD','PROS_LIST','PRO_PROFILE','PRO_PERFORMANCE',
    'TEAM_SUMMON','TEAM_INVITE','PATIENTS_LIST','PATIENT_PROFILE','PATIENT_RECORDS',
    'AGENDA_OVERVIEW','AGENDA_EDIT','ROOMS_STATUS','ROOM_DETAILS','ROOM_EDIT',
    'ROOM_CREATE','ROOM_AGENDA','FINANCE_OVERVIEW','FINANCE_REPASSES',
    'FINANCE_FORECAST','MARKETPLACE_MANAGE','MARKETPLACE_CREATE','EVENTS_MANAGE',
    'EVENT_CREATE','RETREATS_MANAGE','SERVICE_EVALUATION','VAGAS_LIST','VAGA_CREATE',
    'VAGA_CANDIDATES','REPUTATION_OVERVIEW','ANALYTICS_DASH','GOVERNANCE',
    'CHAT_LIST','CHAT_ROOM','PREDICTIVE_OCCUPANCY','AUDIT_LOG','RADIANCE_DRILLDOWN','END'
]

# Read screenMap to check coverage
screenmap_file = BASE / "src" / "navigation" / "screenMap.tsx"
smap_content = screenmap_file.read_text()

missing = []
for state in buscador_states:
    if state == 'END':
        continue
    if f"'{state}':" not in smap_content and f'"{state}":' not in smap_content and f'{state}:' not in smap_content:
        missing.append(('BUSCADOR', state))

for state in guardiao_states:
    if state == 'END':
        continue
    pattern_check = f'{state}:'
    # Check in GUARDIAO section specifically
    guardiao_section = smap_content[smap_content.find('GUARDIAO:'):smap_content.find('SANTUARIO:')]
    if pattern_check not in guardiao_section:
        missing.append(('GUARDIAO', state))

for state in santuario_states:
    if state == 'END':
        continue
    santuario_section = smap_content[smap_content.find('SANTUARIO:'):]
    pattern_check = f'{state}:'
    if pattern_check not in santuario_section:
        missing.append(('SANTUARIO', state))

print(f"  Missing screen mappings: {len(missing)}")
for profile, state in missing:
    print(f"  ❌ {profile}.{state} → NO SCREEN MAPPED")
    results["missing_screen_mappings"].append({"profile": profile, "state": state})


# ─── AUDIT 4: Static Screens (no API calls, no flow transitions) ───
print("\n" + "="*80)
print("🔍 AUDIT 4: Potentially Static Screens (no API, no flow.go)")
print("="*80)

view_dirs = [VIEWS / "client", VIEWS / "pro", VIEWS / "space", 
             VIEWS / "client/generated", VIEWS / "pro/generated", VIEWS / "space/generated",
             VIEWS / "client/chat", VIEWS / "pro/chat", VIEWS / "space/chat",
             VIEWS / "client/garden", VIEWS / "client/tribe", VIEWS / "client/journal",
             VIEWS / "client/financial", VIEWS / "pro/financial", VIEWS / "client/map",
             VIEWS / "gamification", VIEWS / "metamorphosis"]

static_screens = []
for d in view_dirs:
    if not d.exists():
        continue
    for f in d.glob('*.tsx'):
        content = f.read_text(encoding='utf-8', errors='ignore')
        rel = str(f.relative_to(BASE))
        has_api = 'api.' in content or 'fetch(' in content or 'axios' in content
        has_flow = 'flow.go' in content or 'flow.jump' in content or 'flow.back' in content or 'go(' in content
        has_setView = 'setView' in content
        has_navigate = 'navigate(' in content
        has_interaction = has_api or has_flow or has_setView or has_navigate
        
        # Check for "Em breve" or placeholder messages displayed to user
        has_em_breve = bool(re.search(r'[Ee]m\s+breve|[Cc]oming\s+soon|[Ff]uncionalidade.*desenvolvimento', content))
        
        if not has_interaction or has_em_breve:
            reason = []
            if not has_api: reason.append("no-api")
            if not has_flow: reason.append("no-flow")
            if not has_setView: reason.append("no-setView")
            if not has_navigate: reason.append("no-navigate")
            if has_em_breve: reason.append("⚠️ EM-BREVE-DETECTED")
            static_screens.append({
                "file": rel,
                "reason": ", ".join(reason)
            })

print(f"  Potentially static screens: {len(static_screens)}")
for item in static_screens:
    emoji = "🟡" if "EM-BREVE" in item["reason"] else "🔵"
    print(f"  {emoji} {item['file']} → [{item['reason']}]")
    results["static_text_placeholders"].append(item)


# ─── AUDIT 5: Checkout Flow Integrity ───
print("\n" + "="*80)
print("🔍 AUDIT 5: Checkout & Payment Flow Integrity")
print("="*80)

checkout_files = [
    "components/Checkout.tsx",
    "views/client/financial/CheckoutScreen.tsx",
    "views/client/financial/PaymentHistoryScreen.tsx",
    "views/client/generated/PaymentSuccess.tsx",
    "views/client/generated/BookingConfirm.tsx",
    "views/client/generated/Checkout.tsx",
]

for cf in checkout_files:
    full = BASE / cf
    if not full.exists():
        results["checkout_issues"].append({"file": cf, "issue": "FILE_NOT_FOUND"})
        print(f"  ❌ {cf} → FILE NOT FOUND")
    else:
        content = full.read_text(encoding='utf-8', errors='ignore')
        # Check for payment processing
        has_checkout_logic = 'checkout' in content.lower() or 'payment' in content.lower() or 'pagamento' in content.lower()
        has_api_call = 'api.' in content
        if not has_checkout_logic:
            results["checkout_issues"].append({"file": cf, "issue": "NO_CHECKOUT_LOGIC"})
            print(f"  ⚠️  {cf} → No checkout/payment logic found")
        else:
            print(f"  ✅ {cf} → OK")


# ─── AUDIT 6: Gamification Interconnection ───
print("\n" + "="*80)
print("🔍 AUDIT 6: Gamification Integration")
print("="*80)

gamification_keywords = ['karma', 'xp', 'quest', 'achievement', 'level', 'soul_card', 'soulcard',
                          'multiplier', 'badge', 'streak', 'ritual', 'daily_quest', 'grimoire',
                          'radiance', 'evolution', 'metamorphosis']

# Check which screens reference gamification
gamification_usage = defaultdict(list)
for filepath, content in file_contents.items():
    rel = str(Path(filepath).relative_to(BASE))
    if '/tests/' in rel or '/scripts/' in rel or '/node_modules/' in rel:
        continue
    content_lower = content.lower()
    for kw in gamification_keywords:
        if kw in content_lower:
            gamification_usage[kw].append(rel)

print("  Gamification keyword usage across app:")
for kw, files in sorted(gamification_usage.items()):
    unique = set(f.split('/')[0] + '/' + f.split('/')[1] if '/' in f else f for f in files)
    print(f"    🎮 {kw}: {len(files)} refs in {len(unique)} areas")

# Check gamification components exist
gamification_components = [
    "views/client/garden/KarmaWallet.tsx",
    "views/client/garden/AchievementsView.tsx",
    "views/client/garden/ClientQuestsView.tsx",
    "views/client/garden/EvolutionView.tsx",
    "views/client/garden/EvolutionAnalytics.tsx",
    "views/gamification/OracleView.tsx",
    "views/gamification/RitualBuilderView.tsx",
    "views/metamorphosis/MetamorphosisWizard.tsx",
    "views/metamorphosis/SoulCardReveal.tsx",
]

print("\n  Gamification Components Status:")
for gc in gamification_components:
    full = BASE / gc
    if full.exists():
        content = full.read_text(encoding='utf-8', errors='ignore')
        has_api = 'api.' in content
        has_flow = 'flow' in content
        status = "✅" if (has_api or has_flow) else "🔵 (static)"
        print(f"    {status} {gc}")
    else:
        print(f"    ❌ {gc} → MISSING")
        results["gamification_issues"].append({"component": gc, "issue": "MISSING"})


# ─── AUDIT 7: Cross-Profile Interconnections ───
print("\n" + "="*80)
print("🔍 AUDIT 7: Cross-Profile Interconnections")
print("="*80)

# Check Buscador -> Guardião connection (booking, chat)
# Check Buscador -> Santuário (spaces, rooms)
# Check Guardião -> Santuário (contract, rooms)
# Check Santuário -> Guardião (team, recruitment)
# Check Santuário -> Buscador (patients)

interconnections = {
    "Buscador→Guardião": {
        "booking_flow": ["views/client/BookingSearch.tsx", "views/client/BookingSelect.tsx"],
        "chat": ["views/client/chat/ChatListScreen.tsx", "views/client/chat/ChatRoomScreen.tsx"],
    },
    "Buscador→Santuário": {
        "marketplace": ["views/client/ClientMarketplace.tsx"],
    },
    "Guardião→Santuário": {
        "contract": ["views/pro/SantuarioListView.tsx", "views/pro/SantuarioProfileView.tsx", "views/pro/SantuarioContractView.tsx"],
    },
    "Guardião→Buscador": {
        "patients": ["views/pro/generated/PatientsList.tsx", "views/pro/generated/PatientProfile.tsx"],
        "chat": ["views/pro/chat/ProChatListScreen.tsx", "views/pro/chat/ProChatRoomScreen.tsx"],
    },
    "Santuário→Guardião": {
        "team": ["views/space/SpaceTeam.tsx", "views/space/SpaceRecruitment.tsx"],
        "pro_details": ["views/space/generated/SpaceProDetails.tsx"],
    },
    "Santuário→Buscador": {
        "patients": ["views/space/generated/SpacePatients.tsx"],
    },
}

for connection, flows in interconnections.items():
    print(f"\n  📡 {connection}:")
    for flow_name, files in flows.items():
        all_ok = True
        for f in files:
            full = BASE / f
            if not full.exists():
                print(f"    ❌ {flow_name}: {f} → MISSING")
                results["interconnection_gaps"].append({"connection": connection, "flow": flow_name, "file": f, "issue": "MISSING"})
                all_ok = False
            else:
                content = full.read_text(encoding='utf-8', errors='ignore')
                has_real_content = len(content) > 200
                has_interaction = 'api.' in content or 'flow' in content or 'onClick' in content
                if not has_interaction:
                    print(f"    ⚠️  {flow_name}: {f} → No interaction logic")
                    results["interconnection_gaps"].append({"connection": connection, "flow": flow_name, "file": f, "issue": "NO_INTERACTION"})
                    all_ok = False
        if all_ok:
            print(f"    ✅ {flow_name}: All files OK")


# ─── AUDIT 8: Button count per screen ───
print("\n" + "="*80)
print("🔍 AUDIT 8: Button Density Check (screens with <2 interactive elements)")
print("="*80)

low_interaction = []
for filepath, content in file_contents.items():
    rel = str(Path(filepath).relative_to(BASE))
    if not rel.startswith('views/') or '/tests/' in rel or '/scripts/' in rel:
        continue
    if not rel.endswith('.tsx'):
        continue
    
    button_count = content.count('<button') + content.count('onClick')
    link_count = content.count('<a ') + content.count('href=')
    total = button_count + link_count
    lines = len(content.split('\n'))
    
    if lines > 30 and total < 2:
        low_interaction.append({"file": rel, "buttons": button_count, "links": link_count, "lines": lines})

print(f"  Screens with <2 interactive elements: {len(low_interaction)}")
for item in sorted(low_interaction, key=lambda x: x['lines'], reverse=True)[:15]:
    print(f"  🔵 {item['file']} ({item['lines']} lines, {item['buttons']} buttons, {item['links']} links)")


# ─── SUMMARY ───
print("\n" + "="*80)
print("📊 AUDIT SUMMARY")
print("="*80)
print(f"  Placeholder/unfinished content:  {len(results['placeholder_screens'])}")
print(f"  Dead buttons (no-op handlers):   {len(results['dead_buttons'])}")
print(f"  Missing screen mappings:         {len(results['missing_screen_mappings'])}")
print(f"  Potentially static screens:      {len(results['static_text_placeholders'])}")
print(f"  Checkout issues:                 {len(results['checkout_issues'])}")
print(f"  Gamification issues:             {len(results['gamification_issues'])}")
print(f"  Interconnection gaps:            {len(results['interconnection_gaps'])}")
print(f"  Total issues found:              {sum(len(v) for v in results.values())}")

# Save results
output_path = BASE / "scripts" / "diagnosis" / "AUDIT_RESULTS.json"
with open(output_path, 'w') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print(f"\n💾 Full results saved to: {output_path}")
