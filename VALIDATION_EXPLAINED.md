# How Validation Works

## Overview

The validation system checks if your game's **mechanics** (how it plays) and **lore** (the story/world) are consistent with each other. It runs **27 different validation rules** across 6 categories to catch potential conflicts before you start development.

## The Validation Process

### 1. **Trigger**
- Validation runs automatically when you view a version (with a 3-second debounce)
- You can also manually trigger it with the "Re-validate" button
- It analyzes the current version's mechanics and lore together

### 2. **Rule Execution**
The validation engine runs all 27 rules in parallel:

#### **Category 1: Mechanics-Lore Alignment** (10 rules, highest weight)
These are the most critical - they check if gameplay matches the story:

- **Content Completeness**: Core loop, player actions, win conditions, setting, protagonist, and world rules must exist; missing fundamentals reduce consistency confidence.

- **Player Abilities Match**: Do the protagonist's abilities in lore match what they can do in gameplay?
  - Example: If lore says "mage with fire magic" but mechanics only have "sword attacks" → Issue!
  
- **Resource Logic**: Do resource systems make sense in the world?
  - Example: "Mana" resource in a realistic modern setting → Issue!
  
- **Win Conditions Narrative Sound**: Can the win condition actually happen in the story?
  - Example: "Defeat the Dark Lord" but lore says he's immortal → Issue!
  
- **Combat System Consistency**: Does combat match the world's rules?
  - Example: Turn-based combat in a fast-paced action story → Warning
  
- **Magic System Rules**: If magic exists, are the rules consistent?
  - Example: Magic costs "mana" but lore says magic is unlimited → Issue!
  
- **Technology Level Match**: Do tech levels match between mechanics and lore?
  - Example: "Laser weapons" in medieval fantasy → Issue!
  
- **Death Consequences**: How death works in gameplay vs. story
- **Multiplayer Justification**: If multiplayer, does it make narrative sense?
- **Economy Worldbuilding**: Economic systems match the world
- **Progression Explains Power Growth**: Leveling/upgrades make sense in-world

#### **Category 2: Genre Conventions** (1 rule)
Checks if your game follows genre expectations:

- **RPG**: Should have progression/leveling, character abilities
- **FPS**: Should have shooting/weapon mechanics
- **Strategy**: Should have resource management
- **Puzzle**: Should have clear win conditions
- **Survival**: Should have resource scarcity, survival mechanics

#### **Category 3: World Physics** (5 rules)
Checks internal consistency of world rules:

- **Gravity Consistency**: Gravity rules are consistent
- **Material Properties**: Materials behave consistently
- **Time Consistency**: Time flows logically
- **Spatial Logic**: Space/dimensions make sense
- **Causality**: Cause and effect are logical

#### **Category 4: Progression Coherence** (4 rules)
Checks if progression systems make sense:

- **Power Curve**: Difficulty scaling is reasonable
- **Gating Justification**: Why can't players access areas/features?
- **Skill Mastery**: Skill systems are coherent
- **Endgame Reward**: Endgame content is rewarding

#### **Category 5: Narrative Structure** (3 rules)
Checks storytelling basics:

- **Protagonist Motivation**: Does the hero have a clear reason to act?
- **Conflict Resolution**: Can the conflict be resolved through gameplay?
- **Theme Consistency**: Themes are woven throughout mechanics and lore

#### **Category 6: Technical Feasibility** (3 rules)
Reality checks for development:

- **Complexity Estimate**: Is the scope realistic?
- **Performance Considerations**: Will it run smoothly?
- **Scope Reality Check**: Is this achievable?

### 3. **Scoring System**

Each rule returns:
- **Severity**: `error` (critical), `warning` (important), or `info` (suggestion)
- **Confidence**: 0.0 to 1.0 (how sure the rule is about the issue)
- **Weight**: Rules have different importance (1.5 = critical, 0.5 = minor)

**Overall Score Calculation:**
```
Score = 1.0 - (sum of weighted issue scores)
```

- **0.9-1.0**: Excellent - Very consistent
- **0.7-0.9**: Good - Minor issues
- **0.5-0.7**: Fair - Some conflicts
- **0.0-0.5**: Poor - Major inconsistencies

### 4. **Results Storage**

- Issues are saved to the database (`validation_results` table)
- Consistency score is stored in version metadata
- You can dismiss issues you disagree with
- Previous validation results are cleared when re-validating

## Example Validation Flow

1. **Input**: 
   - Mechanics: "Turn-based combat, magic system with mana"
   - Lore: "Fast-paced action hero, unlimited magic powers"

2. **Rules Check**:
   - ❌ Combat System Consistency: "Turn-based doesn't match fast-paced action" (error)
   - ❌ Magic System Rules: "Mana cost contradicts unlimited magic" (error)
   - ⚠️ Player Abilities Match: "Hero described as action-focused but combat is slow" (warning)

3. **Score**: 0.65 (Fair - some conflicts)

4. **Output**: 
   - 3 issues displayed
   - Suggestions: "Consider real-time combat" or "Add mana costs to magic"

## How to Use Validation

1. **Generate** mechanics and/or lore
2. **View** the version - validation runs automatically
3. **Check** the Validation tab for issues
4. **Review** each issue and its suggestion
5. **Refine** the version to fix issues
6. **Re-validate** to see improvements

## Tips

- **High scores (0.8+)** mean your concept is coherent
- **Low scores (<0.6)** mean you should refine before development
- **Dismiss** issues you intentionally want to keep
- **Use refinement** to automatically fix common issues
- **Merge versions** to combine the best parts

## Technical Details

- **26 rules** total
- **Parallel execution** for speed
- **Weighted scoring** (critical rules count more)
- **Confidence levels** (rules can be uncertain)
- **Genre-aware** (different checks for RPG vs FPS)
- **Rate limited** (30 validations/minute to prevent spam)
