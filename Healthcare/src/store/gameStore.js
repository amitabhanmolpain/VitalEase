import { create } from 'zustand';
import { statsAPI } from '../services/statsApi';
import apiClient from '../services/api';

const useGameStore = create((set, get) => ({
  // Player Stats
  xp: 0,
  level: 1,
  totalBattles: 0,
  victories: 0,
  streak: 0,
  highestStreak: 0,
  badges: [],
  
  // Game State
  currentScenario: 0,
  isPlaying: false,
  showResult: false,
  lastResult: null,
  soundEnabled: true,
  loading: false,
  
  // Scenarios
  scenarios: [
    // 🟢 LEVEL 1 – EASY
    {
      id: 1,
      enemy: 'self-doubt-slime',
      difficulty: 'easy',
      situation: "I didn't get good marks in one subject.",
      negativeThought: "I am a complete failure.",
      options: [
        { 
          text: "Yes, I am useless.", 
          isCorrect: false,
          feedback: "This reinforces negative self-worth and ignores your overall abilities."
        },
        { 
          text: "One bad result doesn't define me.", 
          isCorrect: true,
          feedback: "Perfect! One failure is a single event, not proof about your entire life."
        },
        { 
          text: "I should stop studying.", 
          isCorrect: false,
          feedback: "This is giving up instead of learning and improving."
        },
        { 
          text: "Everyone else is better than me.", 
          isCorrect: false,
          feedback: "This is comparison thinking that damages self-esteem."
        }
      ]
    },
    {
      id: 2,
      enemy: 'self-doubt-slime',
      difficulty: 'easy',
      situation: "My friend didn't reply to my message.",
      negativeThought: "They must hate me.",
      options: [
        { 
          text: "Maybe they are just busy.", 
          isCorrect: true,
          feedback: "Excellent! Lack of reply doesn't automatically mean rejection."
        },
        { 
          text: "No one likes me.", 
          isCorrect: false,
          feedback: "This is overgeneralization based on one event."
        },
        { 
          text: "I should never text anyone.", 
          isCorrect: false,
          feedback: "This promotes isolation and avoidance."
        },
        { 
          text: "I always annoy people.", 
          isCorrect: false,
          feedback: "This is negative labeling without evidence."
        }
      ]
    },
    {
      id: 3,
      enemy: 'self-doubt-slime',
      difficulty: 'easy',
      situation: "I made a small mistake at work.",
      negativeThought: "I ruin everything.",
      options: [
        { 
          text: "Everyone makes mistakes sometimes.", 
          isCorrect: true,
          feedback: "Perfect! Mistakes are normal and part of learning."
        },
        { 
          text: "I should quit my job.", 
          isCorrect: false,
          feedback: "This is catastrophizing a small mistake."
        },
        { 
          text: "I'm terrible at everything.", 
          isCorrect: false,
          feedback: "This is all-or-nothing thinking based on one error."
        },
        { 
          text: "I can never improve.", 
          isCorrect: false,
          feedback: "This is fortune-telling that removes hope for growth."
        }
      ]
    },
    {
      id: 4,
      enemy: 'anxiety-ghost',
      difficulty: 'easy',
      situation: "I feel sad today.",
      negativeThought: "I will always feel like this.",
      options: [
        { 
          text: "Feelings change with time.", 
          isCorrect: true,
          feedback: "Great! Emotions are temporary, not permanent."
        },
        { 
          text: "This sadness will never end.", 
          isCorrect: false,
          feedback: "This is fortune-telling and removes hope."
        },
        { 
          text: "My life is hopeless.", 
          isCorrect: false,
          feedback: "This is overgeneralization from a temporary feeling."
        },
        { 
          text: "Nothing will ever help.", 
          isCorrect: false,
          feedback: "This is helplessness that prevents seeking solutions."
        }
      ]
    },
    {
      id: 5,
      enemy: 'self-doubt-slime',
      difficulty: 'easy',
      situation: "I forgot to do one task.",
      negativeThought: "I am so irresponsible.",
      options: [
        { 
          text: "I forgot one thing, that's normal.", 
          isCorrect: true,
          feedback: "Perfect! Everyone forgets things occasionally. It's human."
        },
        { 
          text: "I can't do anything right.", 
          isCorrect: false,
          feedback: "This is all-or-nothing thinking based on one incident."
        },
        { 
          text: "I should punish myself.", 
          isCorrect: false,
          feedback: "Self-punishment reinforces shame and doesn't help."
        },
        { 
          text: "I am a bad person.", 
          isCorrect: false,
          feedback: "This is labeling yourself negatively based on a minor mistake."
        }
      ]
    },
    
    // 🟡 LEVEL 2 – MEDIUM
    {
      id: 6,
      enemy: 'doomsday-dragon',
      difficulty: 'medium',
      situation: "I didn't get selected for a job interview.",
      negativeThought: "I will never be successful.",
      options: [
        { 
          text: "One rejection doesn't decide my future.", 
          isCorrect: true,
          feedback: "Excellent! This challenges all-or-nothing thinking and promotes resilience."
        },
        { 
          text: "I am not good enough.", 
          isCorrect: false,
          feedback: "This is negative self-labeling based on one outcome."
        },
        { 
          text: "No company will ever hire me.", 
          isCorrect: false,
          feedback: "This is fortune-telling and overgeneralization."
        },
        { 
          text: "I should stop applying.", 
          isCorrect: false,
          feedback: "This is giving up instead of learning and persisting."
        }
      ]
    },
    {
      id: 7,
      enemy: 'self-doubt-slime',
      difficulty: 'medium',
      situation: "Someone criticized my work.",
      negativeThought: "I'm terrible at my job.",
      options: [
        { 
          text: "Feedback helps me grow.", 
          isCorrect: true,
          feedback: "Perfect! This reframes criticism as an opportunity for improvement."
        },
        { 
          text: "They are right, I'm useless.", 
          isCorrect: false,
          feedback: "This is accepting negative labels without balanced thinking."
        },
        { 
          text: "I should avoid trying.", 
          isCorrect: false,
          feedback: "This promotes avoidance which prevents growth."
        },
        { 
          text: "Everyone thinks I'm bad.", 
          isCorrect: false,
          feedback: "This is overgeneralization from one person's opinion."
        }
      ]
    },
    {
      id: 8,
      enemy: 'anxiety-ghost',
      difficulty: 'medium',
      situation: "I felt anxious at a social event.",
      negativeThought: "I'm socially awkward and weird.",
      options: [
        { 
          text: "Many people feel nervous sometimes.", 
          isCorrect: true,
          feedback: "Great! This normalizes anxiety and reduces harsh self-judgment."
        },
        { 
          text: "I should avoid all social events.", 
          isCorrect: false,
          feedback: "Avoidance strengthens anxiety over time."
        },
        { 
          text: "People must think I'm strange.", 
          isCorrect: false,
          feedback: "This is mind-reading without evidence."
        },
        { 
          text: "I can never talk properly.", 
          isCorrect: false,
          feedback: "This is all-or-nothing thinking that ignores improvement."
        }
      ]
    },
    {
      id: 9,
      enemy: 'self-doubt-slime',
      difficulty: 'medium',
      situation: "I didn't finish all my tasks today.",
      negativeThought: "I am lazy.",
      options: [
        { 
          text: "I did my best with the energy I had.", 
          isCorrect: true,
          feedback: "Excellent! This shows self-compassion and acknowledges effort."
        },
        { 
          text: "I am useless.", 
          isCorrect: false,
          feedback: "This is harsh labeling that ignores context and effort."
        },
        { 
          text: "I never do anything right.", 
          isCorrect: false,
          feedback: "This is overgeneralization from one day's work."
        },
        { 
          text: "I should give up.", 
          isCorrect: false,
          feedback: "This is defeatist thinking that prevents trying again."
        }
      ]
    },
    {
      id: 10,
      enemy: 'anxiety-ghost',
      difficulty: 'medium',
      situation: "I got ignored in a group chat.",
      negativeThought: "Nobody cares about me.",
      options: [
        { 
          text: "People may just be busy.", 
          isCorrect: true,
          feedback: "Perfect! This considers alternative explanations instead of jumping to conclusions."
        },
        { 
          text: "I have no real friends.", 
          isCorrect: false,
          feedback: "This is overgeneralization based on one moment."
        },
        { 
          text: "Everyone dislikes me.", 
          isCorrect: false,
          feedback: "This is all-or-nothing thinking without evidence."
        },
        { 
          text: "I should stop talking to people.", 
          isCorrect: false,
          feedback: "This promotes isolation which worsens loneliness."
        }
      ]
    },
    
    // 🔴 LEVEL 3 – HARD
    {
      id: 11,
      enemy: 'hopelessness-troll',
      difficulty: 'hard',
      situation: "I've been feeling low for weeks.",
      negativeThought: "My life will never get better.",
      options: [
        { 
          text: "Recovery takes time and effort.", 
          isCorrect: true,
          feedback: "Excellent! This acknowledges the challenge while maintaining hope and agency."
        },
        { 
          text: "Nothing will ever help me.", 
          isCorrect: false,
          feedback: "This is hopelessness that prevents seeking help."
        },
        { 
          text: "I am broken forever.", 
          isCorrect: false,
          feedback: "This is permanent labeling that denies capacity for healing."
        },
        { 
          text: "Trying is pointless.", 
          isCorrect: false,
          feedback: "This is learned helplessness that blocks positive action."
        }
      ]
    },
    {
      id: 12,
      enemy: 'anxiety-ghost',
      difficulty: 'hard',
      situation: "I saw people enjoying without me.",
      negativeThought: "I will always be alone.",
      options: [
        { 
          text: "One moment doesn't decide my whole life.", 
          isCorrect: true,
          feedback: "Perfect! This prevents fortune-telling and overgeneralization."
        },
        { 
          text: "Nobody wants me.", 
          isCorrect: false,
          feedback: "This is overgeneralization based on one observation."
        },
        { 
          text: "I am unlovable.", 
          isCorrect: false,
          feedback: "This is harsh self-labeling that ignores your worth."
        },
        { 
          text: "I don't belong anywhere.", 
          isCorrect: false,
          feedback: "This is all-or-nothing thinking that creates despair."
        }
      ]
    },
    {
      id: 13,
      enemy: 'doomsday-dragon',
      difficulty: 'hard',
      situation: "I feel overwhelmed with responsibilities.",
      negativeThought: "I can't handle life.",
      options: [
        { 
          text: "I can break problems into small steps.", 
          isCorrect: true,
          feedback: "Great! This promotes problem-solving instead of catastrophizing."
        },
        { 
          text: "I am too weak.", 
          isCorrect: false,
          feedback: "This is self-labeling that ignores your strengths."
        },
        { 
          text: "Everything is impossible.", 
          isCorrect: false,
          feedback: "This is all-or-nothing thinking that removes hope."
        },
        { 
          text: "I should just quit.", 
          isCorrect: false,
          feedback: "This is avoidance that prevents finding solutions."
        }
      ]
    },
    {
      id: 14,
      enemy: 'self-doubt-slime',
      difficulty: 'hard',
      situation: "I compared myself to someone successful.",
      negativeThought: "I will never be as good as them.",
      options: [
        { 
          text: "Everyone has their own journey.", 
          isCorrect: true,
          feedback: "Excellent! This prevents harmful comparison and acknowledges individual paths."
        },
        { 
          text: "I am a failure compared to them.", 
          isCorrect: false,
          feedback: "This is comparison trap that ignores your own achievements."
        },
        { 
          text: "I should stop trying.", 
          isCorrect: false,
          feedback: "This is giving up based on comparison."
        },
        { 
          text: "They are better than me in every way.", 
          isCorrect: false,
          feedback: "This is all-or-nothing comparison that's unrealistic."
        }
      ]
    },
    {
      id: 15,
      enemy: 'doomsday-dragon',
      difficulty: 'hard',
      situation: "I made a wrong life decision.",
      negativeThought: "My life is ruined forever.",
      options: [
        { 
          text: "Decisions can be corrected over time.", 
          isCorrect: true,
          feedback: "Perfect! This acknowledges mistakes can be addressed and aren't permanent."
        },
        { 
          text: "There is no hope left.", 
          isCorrect: false,
          feedback: "This is hopelessness that prevents problem-solving."
        },
        { 
          text: "I destroyed everything.", 
          isCorrect: false,
          feedback: "This is catastrophizing and all-or-nothing thinking."
        },
        { 
          text: "I can never recover.", 
          isCorrect: false,
          feedback: "This is fortune-telling that denies your resilience."
        }
      ]
    },
    
    // 🟣 LEVEL 4 – EXTREME / ADVANCED
    {
      id: 16,
      enemy: 'hopelessness-troll',
      difficulty: 'extreme',
      situation: "I'm having repeated depressive episodes.",
      negativeThought: "I will suffer like this forever.",
      options: [
        { 
          text: "I can seek help and improve gradually.", 
          isCorrect: true,
          feedback: "Excellent! This maintains hope and recognizes that professional help works."
        },
        { 
          text: "This is my permanent fate.", 
          isCorrect: false,
          feedback: "This is fortune-telling that denies the possibility of recovery."
        },
        { 
          text: "Nothing can help me.", 
          isCorrect: false,
          feedback: "This is hopelessness that prevents seeking effective treatment."
        },
        { 
          text: "Therapy is useless.", 
          isCorrect: false,
          feedback: "This dismisses evidence-based treatment that helps many people."
        }
      ]
    },
    {
      id: 17,
      enemy: 'hopelessness-troll',
      difficulty: 'extreme',
      situation: "I feel like a burden to my family.",
      negativeThought: "Everyone would be better without me.",
      options: [
        { 
          text: "My family cares about me, even if I struggle.", 
          isCorrect: true,
          feedback: "Perfect! This recognizes love and connection despite challenges. You matter."
        },
        { 
          text: "I don't deserve to exist.", 
          isCorrect: false,
          feedback: "This is deeply harmful thinking. You have inherent worth. Please seek help."
        },
        { 
          text: "I only cause problems.", 
          isCorrect: false,
          feedback: "This ignores your positive impact and value. You deserve support."
        },
        { 
          text: "I should disappear.", 
          isCorrect: false,
          feedback: "This is a crisis thought. Please reach out to a crisis helpline immediately."
        }
      ]
    },
    {
      id: 18,
      enemy: 'doomsday-dragon',
      difficulty: 'extreme',
      situation: "I relapsed into bad habits.",
      negativeThought: "I will never recover.",
      options: [
        { 
          text: "Relapse is part of recovery.", 
          isCorrect: true,
          feedback: "Excellent! Recovery isn't linear. Each attempt teaches you and builds strength."
        },
        { 
          text: "I am hopeless.", 
          isCorrect: false,
          feedback: "This is all-or-nothing thinking. Setbacks don't erase progress."
        },
        { 
          text: "Trying again is pointless.", 
          isCorrect: false,
          feedback: "This is learned helplessness. Recovery is always possible."
        },
        { 
          text: "I failed completely.", 
          isCorrect: false,
          feedback: "This ignores the courage it took to try. You can try again."
        }
      ]
    },
    {
      id: 19,
      enemy: 'hopelessness-troll',
      difficulty: 'extreme',
      situation: "I feel mentally exhausted.",
      negativeThought: "I'm too weak to live normally.",
      options: [
        { 
          text: "Rest and self-care can help me recharge.", 
          isCorrect: true,
          feedback: "Perfect! Exhaustion is temporary. Self-compassion and rest are essential."
        },
        { 
          text: "I am broken.", 
          isCorrect: false,
          feedback: "This is harmful labeling. You're experiencing exhaustion, not brokenness."
        },
        { 
          text: "I can't be fixed.", 
          isCorrect: false,
          feedback: "You're not something to 'fix.' You deserve care and support."
        },
        { 
          text: "Life is too hard for me.", 
          isCorrect: false,
          feedback: "This ignores that you can build strength with support and time."
        }
      ]
    },
    {
      id: 20,
      enemy: 'hopelessness-troll',
      difficulty: 'extreme',
      situation: "I feel like giving up sometimes.",
      negativeThought: "There is no point in trying anymore.",
      options: [
        { 
          text: "Hard times pass; support can help me.", 
          isCorrect: true,
          feedback: "Excellent! Even in very hard moments, reaching for help is the healthiest response. You're not alone."
        },
        { 
          text: "Nothing will ever change.", 
          isCorrect: false,
          feedback: "This is hopelessness. Change is possible with support. Please reach out."
        },
        { 
          text: "I should stop fighting.", 
          isCorrect: false,
          feedback: "Your life matters. Please talk to someone who can help."
        },
        { 
          text: "I don't deserve help.", 
          isCorrect: false,
          feedback: "Everyone deserves help. You matter. Please reach out to a crisis line."
        }
      ]
    }
  ],
  
  // Actions
  addXP: (amount) => set((state) => {
    const newXP = state.xp + amount;
    const newLevel = Math.floor(newXP / 100) + 1;
    const leveledUp = newLevel > state.level;
    
    return {
      xp: newXP,
      level: newLevel,
      ...(leveledUp && { badges: [...state.badges, `Level ${newLevel} Warrior`] })
    };
  }),
  
  incrementStreak: () => set((state) => {
    const newStreak = state.streak + 1;
    const newBadges = [...state.badges];
    
    if (newStreak === 5 && !state.badges.includes("Mind Warrior")) {
      newBadges.push("Mind Warrior");
    }
    if (newStreak === 10 && !state.badges.includes("Thought Champion")) {
      newBadges.push("Thought Champion");
    }
    
    return {
      streak: newStreak,
      highestStreak: Math.max(newStreak, state.highestStreak),
      badges: newBadges
    };
  }),
  
  resetStreak: () => set({ streak: 0 }),
  
  incrementVictories: () => set((state) => {
    const newVictories = state.victories + 1;
    const newBadges = [...state.badges];
    
    if (newVictories === 10 && !state.badges.includes("10 Victories")) {
      newBadges.push("10 Victories");
    }
    if (newVictories === 25 && !state.badges.includes("Battle Master")) {
      newBadges.push("Battle Master");
    }
    
    return { 
      victories: newVictories,
      badges: newBadges
    };
  }),
  
  incrementBattles: () => set((state) => ({ 
    totalBattles: state.totalBattles + 1 
  })),
  
  setResult: (result) => set({ 
    showResult: true, 
    lastResult: result 
  }),
  
  loadScenario: async () => {
    try {
      set({ loading: true });
      const currentLevel = get().level;
      const response = await apiClient.post('/reframe-game/generate-scenario', { level: currentLevel });
      const scenario = response.data;
      set({
        scenarios: [scenario],
        currentScenario: 0,
        loading: false
      });
    } catch (error) {
      console.error("Failed to load dynamic scenario:", error);
      // Fallback to random offline scenario from local scenarios list
      const localScenarios = get().scenarios;
      const randomIdx = Math.floor(Math.random() * (localScenarios.length || 1));
      set({
        currentScenario: randomIdx,
        loading: false
      });
    }
  },

  nextScenario: async () => {
    set({ showResult: false, lastResult: null });
    await get().loadScenario();
  },
  
  startGame: async () => {
    try {
      set({ loading: true });
      const stats = await statsAPI.getStats();
      const gameStats = stats.games?.thoughtbattle || {
        level: 1,
        xp: 0,
        victories: 0,
        losses: 0,
        current_streak: 0
      };
      
      set({
        level: gameStats.level || 1,
        xp: gameStats.xp || 0,
        victories: gameStats.victories || 0,
        totalBattles: (gameStats.victories || 0) + (gameStats.losses || 0),
        streak: gameStats.current_streak || 0,
        highestStreak: Math.max(get().highestStreak, gameStats.current_streak || 0),
        badges: stats.badges || [],
        isPlaying: true
      });

      await get().loadScenario();
    } catch (error) {
      console.error('Failed to load game stats:', error);
      set({ 
        isPlaying: true,
        loading: false 
      });
    }
  },
  
  exitGame: () => set({ 
    isPlaying: false,
    showResult: false,
    lastResult: null 
  }),
  
  toggleSound: () => set((state) => ({ 
    soundEnabled: !state.soundEnabled 
  })),
  
  resetGame: async () => {
    try {
      set({ loading: true });
      await statsAPI.resetGameStats('thoughtbattle');
      set({
        xp: 0,
        level: 1,
        totalBattles: 0,
        victories: 0,
        streak: 0,
        highestStreak: 0,
        badges: [],
        currentScenario: 0,
        isPlaying: false,
        showResult: false,
        lastResult: null
      });
      await get().loadScenario();
    } catch (error) {
      console.error("Failed to reset game:", error);
      set({ loading: false });
    }
  }
}));

export default useGameStore;
