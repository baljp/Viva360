#!/usr/bin/env python3
"""Deep audit of Viva360: buttons, flows, gamification, dead ends."""
import os, re, json, sys
from collections import defaultdict

ROOT = os.path.expanduser("~/Viva360")
RESULTS = {"dead_buttons": [], "missing_screens": [], "flow_gaps": [], "static_screens": [], "duplicate_functions": [], "gamification_gaps": [], "checkout_issues": [], "init_issues": [], "general_bugs": []}

def read_file(path):
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except: return ""

def find_tsx_files(dirs):
    files = []
    for d in dirs:
        full = os.path.join(ROOT, d)
        if not os.path.isdir(full): continue
        for root, _, fnames in os.walk(full):
            if 'node_modules' in root: continue
            for fn in fnames:
                if fn.endswith(('.tsx', '.ts')) and not fn.endswith(('.test.ts', '.spec.ts', '.test.tsx')):
                    files.append(os.path.join(root, fn))
    return files

# 1. Collect all flow states from types
print("=" * 80)
print("VIVA360 DEEP AUDIT")
print("=" * 80)

# Parse Buscador states
buscador_types = read_file(os.path.join(ROOT, "src/flow/types.ts"))
buscador_states = set(re.findall(r"'(\w+)'", buscador_types.split("transitions")[0]))
buscador_transitions = {}
for m in re.finditer(r"(\w+):\s*\[([^\]]+)\]", buscador_types.split("transitions")[1] if "transitions" in buscador_types else ""):
    buscador_transitions[m.group(1)] = re.findall(r"'(\w+)'", m.group(2))

# Parse Guardiao states
guardiao_types = read_file(os.path.join(ROOT, "src/flow/guardiaoTypes.ts"))
guardiao_states = set(re.findall(r"'(\w+)'", guardiao_types.split("guardiaoTransitions")[0]))
guardiao_transitions = {}
for m in re.finditer(r"(\w+):\s*\[([^\]]+)\]", guardiao_types.split("guardiaoTransitions")[1] if "guardiaoTransitions" in guardiao_types else ""):
    guardiao_transitions[m.group(1)] = re.findall(r"'(\w+)'", m.group(2))

# Parse Santuario states
santuario_types = read_file(os.path.join(ROOT, "src/flow/santuarioTypes.ts"))
santuario_states = set(re.findall(r"'(\w+)'", santuario_types.split("santuarioTransitions")[0]))
santuario_transitions = {}
for m in re.finditer(r"(\w+):\s*\[([^\]]+)\]", santuario_types.split("santuarioTransitions")[1] if "santuarioTransitions" in santuario_types else ""):
    santuario_transitions[m.group(1)] = re.findall(r"'(\w+)'", m.group(2))

# Parse screenMap
screenmap = read_file(os.path.join(ROOT, "src/navigation/screenMap.tsx"))
screenmap_buscador = set(re.findall(r"(\w+):\s*\w+", screenmap.split("GUARDIAO")[0])) if "GUARDIAO" in screenmap else set()
screenmap_guardiao = set(re.findall(r"(\w+):\s*\w+", screenmap.split("GUARDIAO")[1].split("SANTUARIO")[0])) if "SANTUARIO" in screenmap else set()
screenmap_santuario = set(re.findall(r"(\w+):\s*\w+", screenmap.split("SANTUARIO")[1])) if "SANTUARIO" in screenmap else set()

print("\n## 1. FLOW STATE vs SCREEN MAP COVERAGE")
print("-" * 60)

# States in transitions but NOT in screenMap
for name, states, smap, transitions in [
    ("BUSCADOR", buscador_states, screenmap_buscador, buscador_transitions),
    ("GUARDIAO", guardiao_states, screenmap_guardiao, guardiao_transitions),
    ("SANTUARIO", santuario_states, screenmap_santuario, santuario_transitions)
]:
    missing = states - smap - {'END', 'START'}
    print(f"\n{name}: {len(states)} states, {len(smap)} mapped")
    if missing:
        print(f"  ❌ States WITHOUT screen: {missing}")
        for s in missing:
            RESULTS["missing_screens"].append({"profile": name, "state": s})
    else:
        print(f"  ✅ All states mapped")
    
    # Check for dead-end states (no outgoing transitions)
    for state, targets in transitions.items():
        if state == 'END': continue
        if not targets:
            print(f"  ❌ Dead-end state (no transitions): {state}")
            RESULTS["flow_gaps"].append({"profile": name, "state": state, "issue": "no outgoing transitions"})

# 2. Audit all view files for button handlers
print("\n\n## 2. BUTTON/CLICK HANDLER AUDIT")
print("-" * 60)

all_files = find_tsx_files(["views", "components"])
empty_handlers = []
commented_handlers = []
setview_calls = defaultdict(list)
go_calls = defaultdict(list)

for fpath in all_files:
    content = read_file(fpath)
    rel = os.path.relpath(fpath, ROOT)
    lines = content.split('\n')
    
    for i, line in enumerate(lines):
        # Find onClick with empty arrow or just console.log
        if re.search(r'onClick=\{?\(\)\s*=>\s*\{\s*\}\}?', line):
            empty_handlers.append({"file": rel, "line": i+1, "code": line.strip()[:100]})
        
        # Find onClick={() => {}} with only comments
        if re.search(r'onClick=\{?\(\)\s*=>\s*\{?\s*(//|/\*)', line):
            commented_handlers.append({"file": rel, "line": i+1, "code": line.strip()[:100]})
        
        # Find buttons without onClick
        if '<button' in line.lower() and 'onClick' not in line and 'onclick' not in line:
            # Check next few lines for onClick
            snippet = '\n'.join(lines[i:i+3])
            if 'onClick' not in snippet and 'onclick' not in snippet and 'type="submit"' not in snippet:
                pass  # many buttons are multi-line, skip false positives
        
        # Collect go() calls  
        for m in re.finditer(r"go\('(\w+)'\)", line):
            go_calls[m.group(1)].append(rel)
        
        # Collect setView calls
        for m in re.finditer(r"setView\(ViewState\.(\w+)\)", line):
            setview_calls[m.group(1)].append(rel)

if empty_handlers:
    print(f"\n❌ Empty onClick handlers: {len(empty_handlers)}")
    for h in empty_handlers[:20]:
        print(f"  {h['file']}:{h['line']} → {h['code']}")
        RESULTS["dead_buttons"].append(h)
else:
    print("✅ No empty onClick handlers found")

if commented_handlers:
    print(f"\n⚠️  Commented onClick handlers: {len(commented_handlers)}")
    for h in commented_handlers[:10]:
        print(f"  {h['file']}:{h['line']} → {h['code']}")

# 3. Check for go() targets that aren't in transitions
print("\n\n## 3. GO() TARGETS vs TRANSITIONS")
print("-" * 60)
all_transition_targets = set()
for d in [buscador_transitions, guardiao_transitions, santuario_transitions]:
    for targets in d.values():
        all_transition_targets.update(targets)
    all_transition_targets.update(d.keys())

orphan_targets = set(go_calls.keys()) - all_transition_targets - {'DASHBOARD', 'START'}
if orphan_targets:
    print(f"❌ go() targets NOT in any transition: {orphan_targets}")
    for t in orphan_targets:
        print(f"  '{t}' called from: {go_calls[t][:3]}")
        RESULTS["flow_gaps"].append({"state": t, "issue": "go() target not in transitions", "files": go_calls[t][:3]})
else:
    print("✅ All go() targets have valid transitions")

# 4. Static screens (views with NO interactive elements)
print("\n\n## 4. STATIC / LOW-INTERACTION SCREENS")
print("-" * 60)
for fpath in all_files:
    if '/generated/' not in fpath and '/views/' in fpath:
        content = read_file(fpath)
        rel = os.path.relpath(fpath, ROOT)
        onclick_count = content.count('onClick')
        go_count = len(re.findall(r"go\('", content))
        button_count = content.lower().count('<button')
        
        if onclick_count <= 1 and go_count == 0 and button_count <= 1 and len(content) > 500:
            print(f"  ⚠️  Low interaction: {rel} (onClick={onclick_count}, go()={go_count}, buttons={button_count})")
            RESULTS["static_screens"].append({"file": rel, "onclick": onclick_count, "go": go_count})

# 5. Gamification audit
print("\n\n## 5. GAMIFICATION AUDIT")
print("-" * 60)
gamification_keywords = {
    'karma': 0, 'xp': 0, 'streak': 0, 'level': 0, 'reward': 0, 
    'achievement': 0, 'badge': 0, 'quest': 0, 'challenge': 0,
    'leaderboard': 0, 'points': 0, 'rank': 0, 'milestone': 0,
    'daily': 0, 'ritual': 0, 'blessing': 0
}

for fpath in all_files:
    content = read_file(fpath).lower()
    for kw in gamification_keywords:
        if kw in content:
            gamification_keywords[kw] += 1

print("Gamification element usage across views:")
for kw, count in sorted(gamification_keywords.items(), key=lambda x: -x[1]):
    status = "✅" if count >= 3 else "⚠️ " if count >= 1 else "❌"
    print(f"  {status} {kw}: used in {count} files")
    if count < 2:
        RESULTS["gamification_gaps"].append({"element": kw, "usage_count": count})

# 6. Checkout flow audit
print("\n\n## 6. CHECKOUT FLOW AUDIT")  
print("-" * 60)
checkout_files = [f for f in all_files if 'checkout' in f.lower() or 'payment' in f.lower() or 'booking' in f.lower()]
for fpath in checkout_files:
    content = read_file(fpath)
    rel = os.path.relpath(fpath, ROOT)
    has_loading = 'loading' in content.lower() or 'isLoading' in content or 'isSaving' in content
    has_error = 'error' in content.lower() or 'catch' in content
    has_success = 'success' in content.lower() or 'toast' in content.lower() or 'Toast' in content
    has_confirm = 'confirm' in content.lower() or 'confirmar' in content.lower()
    
    issues = []
    if not has_loading: issues.append("no loading state")
    if not has_error: issues.append("no error handling")
    if not has_success: issues.append("no success feedback")
    
    if issues:
        print(f"  ⚠️  {rel}: {', '.join(issues)}")
        RESULTS["checkout_issues"].append({"file": rel, "issues": issues})
    else:
        print(f"  ✅ {rel}: loading + error + success states OK")

# 7. Profile initialization audit
print("\n\n## 7. PROFILE INITIALIZATION AUDIT")
print("-" * 60)
for profile, context_file in [
    ("Buscador", "src/flow/BuscadorFlowContext.tsx"),
    ("Guardião", "src/flow/GuardiaoFlowContext.tsx"),
    ("Santuário", "src/flow/SantuarioFlowContext.tsx")
]:
    content = read_file(os.path.join(ROOT, context_file))
    has_init = 'useEffect' in content or 'init' in content.lower()
    has_refresh = 'refresh' in content.lower() or 'refetch' in content.lower()
    has_error = 'error' in content.lower() or 'catch' in content
    has_loading = 'loading' in content.lower() or 'isLoading' in content
    
    issues = []
    if not has_loading: issues.append("no loading state")
    if not has_error: issues.append("no error handling")
    if not has_refresh: issues.append("no refresh capability")
    
    if issues:
        print(f"  ⚠️  {profile}: {', '.join(issues)}")
        RESULTS["init_issues"].append({"profile": profile, "issues": issues})
    else:
        print(f"  ✅ {profile}: init OK")

# 8. Find duplicate component rendering (same component for multiple states)
print("\n\n## 8. DUPLICATE SCREEN MAPPING")
print("-" * 60)
for profile_name, section in [("BUSCADOR", "BUSCADOR"), ("GUARDIAO", "GUARDIAO"), ("SANTUARIO", "SANTUARIO")]:
    if section not in screenmap: continue
    # Extract state -> component pairs
    section_text = screenmap.split(section + ":")[1].split("}")[0] if section + ":" in screenmap else ""
    pairs = re.findall(r"(\w+):\s*(\w+)", section_text)
    
    comp_to_states = defaultdict(list)
    for state, comp in pairs:
        comp_to_states[comp].append(state)
    
    for comp, states in comp_to_states.items():
        if len(states) > 2:
            print(f"  ⚠️  {profile_name}: {comp} handles {len(states)} states: {states}")

# 9. Flows that don't end properly
print("\n\n## 9. FLOW COMPLETION CHECK")
print("-" * 60)
wizard_files = [f for f in all_files if 'wizard' in f.lower() or 'Wizard' in os.path.basename(f)]
for fpath in wizard_files:
    content = read_file(fpath)
    rel = os.path.relpath(fpath, ROOT)
    has_onclose = 'onClose' in content
    has_completion = 'conclu' in content.lower() or 'complet' in content.lower() or 'finaliz' in content.lower() or 'sucesso' in content.lower()
    has_back_to_dash = "'DASHBOARD'" in content or "DASHBOARD" in content
    
    issues = []
    if not has_onclose: issues.append("no onClose")
    if not has_completion: issues.append("no completion message")
    if not has_back_to_dash: issues.append("no return to dashboard")
    
    if issues:
        print(f"  ⚠️  {rel}: {', '.join(issues)}")
    else:
        print(f"  ✅ {rel}: completion flow OK")

# 10. Look for hidden/invisible buttons
print("\n\n## 10. HIDDEN/INVISIBLE ELEMENTS WITH HANDLERS")
print("-" * 60)
hidden_count = 0
for fpath in all_files:
    content = read_file(fpath)
    rel = os.path.relpath(fpath, ROOT)
    # Find elements with hidden/opacity-0/invisible AND onClick
    for m in re.finditer(r'(hidden|opacity-0|invisible|display:\s*none|sr-only)[^>]*onClick', content):
        print(f"  ⚠️  {rel}: hidden element with onClick")
        hidden_count += 1
        RESULTS["general_bugs"].append({"file": rel, "issue": "hidden element with onClick handler"})

if hidden_count == 0:
    print("  ✅ No hidden elements with click handlers found")

# Summary
print("\n\n" + "=" * 80)
print("AUDIT SUMMARY")
print("=" * 80)
total_issues = sum(len(v) for v in RESULTS.values())
print(f"Total issues found: {total_issues}")
for category, items in RESULTS.items():
    if items:
        print(f"  {'❌' if len(items) > 3 else '⚠️'} {category}: {len(items)} issues")
    else:
        print(f"  ✅ {category}: no issues")

# Write results
with open(os.path.join(ROOT, "AUDIT_RESULTS.json"), 'w') as f:
    json.dump(RESULTS, f, indent=2, ensure_ascii=False)
print(f"\nDetailed results saved to AUDIT_RESULTS.json")
