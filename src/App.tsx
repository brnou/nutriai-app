import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Utensils, 
  History, 
  Calendar, 
  User, 
  Plus, 
  Camera, 
  Droplets, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  Info, 
  Settings, 
  Bell, 
  Share2, 
  Download,
  Trash2,
  Image as ImageIcon,
  Scan,
  Activity,
  Flame,
  Target,
  Search,
  Heart,
  Coffee,
  Moon,
  Zap,
  MoreVertical,
  Verified,
  BarChart3,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Sun
} from 'lucide-react';
import { 
  UserProfile, 
  Meal, 
  WaterIntake, 
  AppState, 
  INITIAL_PROFILE,
  Goal,
  ActivityLevel,
  Gender,
  HealthCondition,
  DietaryPreference
} from './types';
import { analyzeFoodImage } from './services/gemini';

// --- Helper Functions ---

const calculateCalories = (profile: UserProfile): number => {
  const { weight, height, age, gender, activityLevel, goal } = profile;
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'male') bmr += 5;
  else if (gender === 'female') bmr -= 161;
  else bmr -= 78; // average

  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  };

  const tdee = bmr * activityMultipliers[activityLevel];
  
  const goalAdjustments: Record<Goal, number> = {
    lose: -500,
    maintain: 0,
    gain: 500,
  };

  return Math.round(tdee + goalAdjustments[goal]);
};

const calculateBiologicalAge = (profile: UserProfile): number => {
  let bioAge = profile.age;
  
  const activityImpact: Record<ActivityLevel, number> = {
    sedentary: 2,
    lightly_active: 0,
    moderate: -1,
    very_active: -3,
  };
  
  bioAge += activityImpact[profile.activityLevel];
  
  if (profile.healthConditions.includes('diabetes')) bioAge += 3;
  if (profile.healthConditions.includes('hypertension')) bioAge += 2;
  
  return Math.max(18, bioAge);
};

// --- Main Component ---

export default function App() {
  const [view, setView] = useState<string>('splash');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('nutriai_dark_mode');
    const isDark = saved === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return isDark;
  });

  useEffect(() => {
    localStorage.setItem('nutriai_dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('nutriai_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    return {
      profile: INITIAL_PROFILE,
      meals: [],
      water: [],
    };
  });

  useEffect(() => {
    localStorage.setItem('nutriai_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (view === 'splash') {
      const timer = setTimeout(() => {
        if (state.profile.onboarded) {
          setView('dashboard');
        } else {
          setView('onboarding-1');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [view, state.profile.onboarded]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setState(prev => {
      const newProfile = { ...prev.profile, ...updates };
      // Recalculate calories and bio age if relevant fields changed
      newProfile.dailyCalorieGoal = calculateCalories(newProfile);
      newProfile.biologicalAge = calculateBiologicalAge(newProfile);
      return { ...prev, profile: newProfile };
    });
  };

  const addMeal = (meal: Meal) => {
    setState(prev => ({ ...prev, meals: [meal, ...prev.meals] }));
  };

  const deleteMeal = (id: string) => {
    setState(prev => ({ ...prev, meals: prev.meals.filter(m => m.id !== id) }));
  };

  const addWater = (amount: number) => {
    setState(prev => ({
      ...prev,
      water: [{ amount, timestamp: Date.now() }, ...prev.water]
    }));
  };

  const resetData = () => {
    if (confirm("Are you sure you want to reset all data?")) {
      setState({
        profile: INITIAL_PROFILE,
        meals: [],
        water: [],
      });
      setView('onboarding-1');
    }
  };

  // --- Sub-Components (Views) ---

  const Splash = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-primary text-white">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <Utensils className="size-20 mb-4" />
        <h1 className="text-4xl font-black tracking-tighter">NutriAI</h1>
        <p className="text-white/80 font-medium">Your Intelligent Nutritionist</p>
      </motion.div>
    </div>
  );

  const Onboarding1 = () => (
    <div className="flex flex-col h-screen p-6 bg-background-light dark:bg-background-dark">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-bold">NutriAI Onboarding</h2>
        <span className="text-xs font-bold text-slate-400">Step 1 of 4</span>
      </div>
      <div className="flex-1">
        <h3 className="text-3xl font-black tracking-tight mb-2">What is your primary goal?</h3>
        <p className="text-slate-500 mb-8">Tell us what you want to achieve.</p>
        
        <div className="space-y-4">
          {[
            { id: 'lose', label: 'Lose weight', desc: 'Burn fat and achieve a leaner physique', icon: <Target className="text-primary" /> },
            { id: 'maintain', label: 'Maintain weight', desc: 'Optimize health and stabilize current weight', icon: <Activity className="text-primary" /> },
            { id: 'gain', label: 'Gain muscle', desc: 'Build strength and increase lean mass', icon: <Zap className="text-primary" /> },
          ].map((goal) => (
            <button
              key={goal.id}
              onClick={() => {
                updateProfile({ goal: goal.id as Goal });
                setView('onboarding-2');
              }}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                state.profile.goal === goal.id ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="p-3 bg-primary/10 rounded-xl">{goal.icon}</div>
              <div className="flex-1">
                <p className="font-bold">{goal.label}</p>
                <p className="text-xs text-slate-500">{goal.desc}</p>
              </div>
              <ChevronRight className="text-slate-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const Onboarding2 = () => (
    <div className="flex flex-col h-screen p-6 bg-background-light dark:bg-background-dark">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('onboarding-1')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="size-5" />
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-8">Activity Level</h2>
        <span className="text-xs font-bold text-slate-400">Step 2 of 4</span>
      </div>
      
      <div className="flex-1">
        <h3 className="text-3xl font-black tracking-tight mb-2">How active are you?</h3>
        <p className="text-slate-500 mb-8">This helps us calculate your daily needs.</p>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise' },
            { id: 'lightly_active', label: 'Lightly Active', desc: '1-2 days/week' },
            { id: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
            { id: 'very_active', label: 'Very Active', desc: 'Daily hard exercise' },
          ].map((level) => (
            <button
              key={level.id}
              onClick={() => {
                updateProfile({ activityLevel: level.id as ActivityLevel });
                setView('onboarding-3');
              }}
              className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all text-center ${
                state.profile.activityLevel === level.id ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <p className="font-bold text-sm">{level.label}</p>
              <p className="text-[10px] text-slate-500">{level.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const Onboarding3 = () => {
    const [age, setAge] = useState(state.profile.age);
    const [weight, setWeight] = useState(state.profile.weight);
    const [height, setHeight] = useState(state.profile.height);
    const [gender, setGender] = useState<Gender>(state.profile.gender);
    const [conditions, setConditions] = useState<HealthCondition[]>(state.profile.healthConditions);

    const toggleCondition = (cond: HealthCondition) => {
      setConditions(prev => prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]);
    };

    const handleContinue = () => {
      updateProfile({ age, weight, height, gender, healthConditions: conditions });
      setView('onboarding-4');
    };

    return (
      <div className="flex flex-col h-screen p-6 bg-background-light dark:bg-background-dark overflow-y-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('onboarding-2')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="size-5" />
          </button>
          <h2 className="text-lg font-bold flex-1 text-center pr-8">Personal Info</h2>
          <span className="text-xs font-bold text-slate-400">Step 3 of 4</span>
        </div>

        <div className="space-y-6">
          <h3 className="text-3xl font-black tracking-tight">Tell us about yourself</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Age</label>
              <input 
                type="number" 
                value={age} 
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-primary outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Weight (kg)</label>
                <input 
                  type="number" 
                  value={weight} 
                  onChange={(e) => setWeight(parseInt(e.target.value))}
                  className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Height (cm)</label>
                <input 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(parseInt(e.target.value))}
                  className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {['male', 'female', 'other'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g as Gender)}
                    className={`p-3 rounded-xl border-2 capitalize font-bold text-sm ${
                      gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Health Conditions</label>
              <div className="flex flex-wrap gap-2">
                {['diabetes', 'hypertension', 'allergies'].map((cond) => (
                  <button
                    key={cond}
                    onClick={() => toggleCondition(cond as HealthCondition)}
                    className={`px-4 py-2 rounded-full border-2 text-xs font-bold capitalize flex items-center gap-2 ${
                      conditions.includes(cond as HealthCondition) ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {conditions.includes(cond as HealthCondition) ? <CheckCircle2 className="size-3" /> : <Plus className="size-3" />}
                    {cond}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleContinue}
            className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 mt-8"
          >
            Calculate My Plan
          </button>
        </div>
      </div>
    );
  };

  const Onboarding4 = () => (
    <div className="flex flex-col h-screen p-6 bg-background-light dark:bg-background-dark">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('onboarding-3')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="size-5" />
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-8">Analysis Results</h2>
        <span className="text-xs font-bold text-slate-400">Step 4 of 4</span>
      </div>

      <div className="flex-1 space-y-8">
        <div className="text-center">
          <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="size-10 text-primary" />
          </div>
          <h3 className="text-3xl font-black tracking-tight">Your Personalized Plan</h3>
          <p className="text-slate-500">Based on your profile and health data.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-primary/10 shadow-xl space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Calories</p>
              <p className="text-4xl font-black text-primary">{state.profile.dailyCalorieGoal}</p>
              <p className="text-xs font-bold text-slate-500">kcal / day</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Biological Age</p>
              <p className="text-4xl font-black text-primary">{state.profile.biologicalAge}</p>
              <p className="text-xs font-bold text-slate-500">years old</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 text-sm font-medium text-slate-500">
            <Info className="size-4 text-primary" />
            <p>Your biological age is {state.profile.biologicalAge - state.profile.age > 0 ? 'higher' : 'lower'} than your actual age.</p>
          </div>
        </div>

        <button 
          onClick={() => {
            updateProfile({ onboarded: true });
            setView('dashboard');
          }}
          className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-2 text-lg"
        >
          Start My Journey
          <ChevronRight className="size-6" />
        </button>
      </div>
    </div>
  );

  const Dashboard = () => {
    const today = new Date().setHours(0,0,0,0);
    const todayMeals = state.meals.filter(m => new Date(m.timestamp).setHours(0,0,0,0) === today);
    const consumedCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
    const remainingCalories = Math.max(0, state.profile.dailyCalorieGoal - consumedCalories);
    const progress = Math.min(100, (consumedCalories / state.profile.dailyCalorieGoal) * 100);

    const protein = todayMeals.reduce((acc, m) => acc + m.protein, 0);
    const carbs = todayMeals.reduce((acc, m) => acc + m.carbs, 0);
    const fats = todayMeals.reduce((acc, m) => acc + m.fats, 0);

    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
        <header className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
              <img 
                src="https://picsum.photos/seed/alex/200" 
                alt="Profile" 
                className="size-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Welcome back,</p>
              <h1 className="text-lg font-black tracking-tight">{state.profile.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleDarkMode} 
              className="size-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="size-5 text-yellow-500" /> : <Moon className="size-5 text-slate-500" />}
            </button>
            <button onClick={() => setView('profile')} className="size-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
              <Settings className="size-5 text-slate-500" />
            </button>
          </div>
        </header>

        <main className="px-6 space-y-6">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Calories Consumed Today</h2>
            
            <div className="relative size-56">
              <svg className="size-full transform -rotate-90">
                <circle 
                  cx="112" cy="112" r="100" 
                  className="stroke-slate-100 dark:stroke-slate-800 fill-none" 
                  strokeWidth="12" 
                />
                <circle 
                  cx="112" cy="112" r="100" 
                  className="stroke-primary fill-none transition-all duration-1000" 
                  strokeWidth="12" 
                  strokeDasharray={628}
                  strokeDashoffset={628 - (628 * progress) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black tracking-tighter">{consumedCalories.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-400 mt-1">/ {state.profile.dailyCalorieGoal.toLocaleString()} kcal</span>
              </div>
            </div>

            <div className="grid grid-cols-3 w-full gap-4 mt-10 pt-8 border-t border-slate-50 dark:border-slate-800">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Protein</p>
                <p className="font-black text-primary">{protein}g</p>
              </div>
              <div className="text-center border-x border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Carbs</p>
                <p className="font-black text-primary">{carbs}g</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fats</p>
                <p className="font-black text-primary">{fats}g</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Target className="size-5 text-primary" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Goal</p>
              <p className="text-xl font-black mt-1">{state.profile.dailyCalorieGoal.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">kcal</span></p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="size-10 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                <Flame className="size-5 text-orange-500" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining</p>
              <p className="text-xl font-black mt-1">{remainingCalories.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">kcal</span></p>
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black tracking-tight">Recent Meals</h3>
              <button onClick={() => setView('history')} className="text-primary text-xs font-bold hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {todayMeals.length > 0 ? todayMeals.slice(0, 3).map(meal => (
                <div key={meal.id} className="flex items-center p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="size-14 rounded-xl bg-primary/10 overflow-hidden shrink-0">
                    <img 
                      src={meal.imageUrl || `https://picsum.photos/seed/${meal.name}/200`} 
                      alt={meal.name} 
                      className="size-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="font-bold text-sm">{meal.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{meal.type} • {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-primary">{meal.calories} kcal</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 text-sm font-medium">No meals logged today yet.</p>
                </div>
              )}
            </div>
          </section>
        </main>
        <NavBar active="home" />
      </div>
    );
  };

  const Analysis = () => {
    const [image, setImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<Partial<Meal> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCapture = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setImage(base64);
          analyze(base64);
        };
        reader.readAsDataURL(file);
      }
    };

    const analyze = async (base64: string) => {
      setAnalyzing(true);
      try {
        const data = await analyzeFoodImage(base64);
        setResult(data);
      } catch (e) {
        alert("Analysis failed. Please try again.");
      } finally {
        setAnalyzing(false);
      }
    };

    const handleLogMeal = () => {
      if (result) {
        addMeal({
          id: Math.random().toString(36).substr(2, 9),
          name: result.name || 'Unknown Food',
          type: 'lunch', // default
          calories: result.calories || 0,
          protein: result.protein || 0,
          carbs: result.carbs || 0,
          fats: result.fats || 0,
          fiber: result.fiber || 0,
          timestamp: Date.now(),
          imageUrl: image || undefined,
          description: result.description,
        });
        setView('dashboard');
      }
    };

    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32">
        <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 p-4">
          <div className="flex items-center justify-between max-w-md mx-auto w-full">
            <button onClick={() => setView('dashboard')} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-lg font-black tracking-tight">NutriAI Analysis</h1>
            <div className="size-10" />
          </div>
        </header>

        <main className="flex-1 p-6 space-y-8">
          {!image ? (
            <div className="flex flex-col items-center justify-center py-12 gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse scale-125"></div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex items-center justify-center rounded-full size-32 bg-primary text-white shadow-2xl shadow-primary/30 transition-transform active:scale-95"
                >
                  <Camera className="size-12" />
                </button>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black tracking-tight mb-2">Analyze Your Meal</h3>
                <p className="text-slate-500 text-sm">Take a photo or upload an image to get instant nutritional breakdown.</p>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={fileInputRef} 
                onChange={handleCapture} 
                className="hidden" 
              />
              <div className="flex gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-primary/20 shadow-sm text-sm font-bold">
                  <ImageIcon className="size-5 text-primary" />
                  Upload
                </button>
                <button onClick={() => setView('history')} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-primary/20 shadow-sm text-sm font-bold">
                  <History className="size-5 text-primary" />
                  History
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-primary/10">
                <div className="aspect-square w-full bg-slate-200 dark:bg-slate-800 relative">
                  <img src={image} alt="Food" className="size-full object-cover" />
                  {analyzing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                      <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="font-bold">Analyzing with AI...</p>
                    </div>
                  )}
                  {result && (
                    <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg">
                      98% Match
                    </div>
                  )}
                </div>
                
                {result && (
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Detected Food</p>
                        <h2 className="text-2xl font-black tracking-tight">{result.name}</h2>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {result.description || "A delicious and nutritious meal analyzed by our AI."}
                    </p>
                  </div>
                )}
              </div>

              {result && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nutritional Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Calories', value: result.calories, unit: 'kcal', color: 'text-primary' },
                      { label: 'Protein', value: result.protein, unit: 'g', color: 'text-slate-700 dark:text-slate-200' },
                      { label: 'Carbs', value: result.carbs, unit: 'g', color: 'text-slate-700 dark:text-slate-200' },
                      { label: 'Fats', value: result.fats, unit: 'g', color: 'text-slate-700 dark:text-slate-200' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-primary/10 flex flex-col items-center text-center shadow-sm">
                        <span className={`text-2xl font-black ${stat.color}`}>{stat.value}{stat.unit === 'kcal' ? '' : stat.unit}</span>
                        <span className="text-[10px] font-bold uppercase text-slate-400 mt-1">{stat.label} {stat.unit === 'kcal' ? `(${stat.unit})` : ''}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-black flex items-center gap-2">
                        <Activity className="size-4 text-primary" />
                        Fiber Content
                      </span>
                      <span className="text-sm font-black">{result.fiber}g</span>
                    </div>
                    <div className="w-full bg-primary/20 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: '40%' }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3 italic font-medium">Excellent source of daily fiber intake.</p>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button 
                      onClick={handleLogMeal}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <Plus className="size-5" />
                      Add to Daily Log
                    </button>
                    <button 
                      onClick={() => { setImage(null); setResult(null); }}
                      className="w-full py-3 text-primary font-bold text-sm"
                    >
                      Retake Photo
                    </button>
                  </div>
                </motion.section>
              )}
            </div>
          )}
        </main>
        <NavBar active="analysis" />
      </div>
    );
  };

  const HistoryView = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const consumedCalories = state.meals.reduce((acc, m) => acc + m.calories, 0);
    const protein = state.meals.reduce((acc, m) => acc + m.protein, 0);
    const carbs = state.meals.reduce((acc, m) => acc + m.carbs, 0);
    const fats = state.meals.reduce((acc, m) => acc + m.fats, 0);

    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32">
        <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 p-4">
          <div className="flex items-center justify-between max-w-md mx-auto w-full">
            <button onClick={() => setView('dashboard')} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-lg font-black tracking-tight">Meal History</h1>
            <button className="p-2 rounded-full hover:bg-primary/10 transition-colors">
              <Calendar className="size-5 text-primary" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">Logged Meals</h2>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{today}</span>
          </div>

          <div className="space-y-4">
            {state.meals.length > 0 ? state.meals.map(meal => (
              <div key={meal.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-primary/5 shadow-sm">
                <div className="size-16 rounded-xl bg-primary/10 overflow-hidden shrink-0">
                  <img 
                    src={meal.imageUrl || `https://picsum.photos/seed/${meal.name}/200`} 
                    alt={meal.name} 
                    className="size-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate capitalize">{meal.type}: {meal.name}</p>
                  <p className="text-[10px] text-slate-400">{new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-black text-primary">{meal.calories}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">kcal</p>
                  </div>
                  <button 
                    onClick={() => { if(confirm('Delete this meal?')) deleteMeal(meal.id); }}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Utensils className="size-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <p className="text-slate-400 text-sm font-medium">No meals logged yet.</p>
              </div>
            )}
          </div>

          {state.meals.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-primary/10 shadow-xl space-y-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5 text-primary" />
                <h3 className="text-lg font-black tracking-tight">Nutrition Summary</h3>
              </div>
              
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Total Calories</p>
                  <p className="text-xs font-bold text-slate-400">{Math.round((consumedCalories / state.profile.dailyCalorieGoal) * 100)}%</p>
                </div>
                <p className="text-4xl font-black tracking-tighter">{consumedCalories.toLocaleString()} <span className="text-sm font-bold text-slate-400">/ {state.profile.dailyCalorieGoal} kcal</span></p>
                <div className="w-full h-2 bg-primary/10 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (consumedCalories / state.profile.dailyCalorieGoal) * 100)}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Protein', value: protein, goal: 150 },
                  { label: 'Carbs', value: carbs, goal: 250 },
                  { label: 'Fats', value: fats, goal: 70 },
                ].map(macro => (
                  <div key={macro.label} className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{macro.label}</p>
                    <p className="text-xl font-black tracking-tight">{macro.value}g</p>
                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (macro.value / macro.goal) * 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
        <NavBar active="history" />
      </div>
    );
  };

  const Hydration = () => {
    const today = new Date().setHours(0,0,0,0);
    const todayWater = state.water.filter(w => new Date(w.timestamp).setHours(0,0,0,0) === today);
    const totalWater = todayWater.reduce((acc, w) => acc + w.amount, 0) / 1000;
    const [goalWater, setGoalWater] = useState(() => {
      const saved = localStorage.getItem('nutriai_water_goal');
      return saved ? parseFloat(saved) : 2.5;
    });
    const [editingGoal, setEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState(goalWater.toString());
    const progress = Math.min(100, (totalWater / goalWater) * 100);

    const saveGoal = () => {
      const val = parseFloat(tempGoal);
      if (!isNaN(val) && val > 0) {
        setGoalWater(val);
        localStorage.setItem('nutriai_water_goal', val.toString());
      }
      setEditingGoal(false);
    };

    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32">
        <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 p-4">
          <div className="flex items-center justify-between max-w-md mx-auto w-full">
            <button onClick={() => setView('dashboard')} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-lg font-black tracking-tight">Hydration Tracker</h1>
            <button className="p-2 rounded-full hover:bg-primary/10 transition-colors">
              <Calendar className="size-5 text-primary" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-12">
          <div className="flex flex-col items-center pt-8">
            <div className="relative size-64">
              <svg className="size-full transform -rotate-90">
                <circle cx="128" cy="128" r="110" className="stroke-primary/10 fill-none" strokeWidth="12" />
                <circle 
                  cx="128" cy="128" r="110" 
                  className="stroke-primary fill-none transition-all duration-1000" 
                  strokeWidth="12" 
                  strokeDasharray={691}
                  strokeDashoffset={691 - (691 * progress) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Droplets className="size-12 text-primary mb-2 fill-primary" />
                <h1 className="text-5xl font-black tracking-tighter">{totalWater.toFixed(1)}<span className="text-xl font-bold text-slate-400"> / {goalWater}L</span></h1>
                <p className="text-slate-400 text-sm font-bold mt-1">{Math.round(progress)}% of Daily Goal</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8">
            <button 
              onClick={() => addWater(250)}
              className="w-full max-w-xs py-10 bg-primary text-white rounded-3xl shadow-2xl shadow-primary/30 flex flex-col items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="size-8" />
              <span className="text-xl font-black tracking-tight">Add 250ml Glass</span>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{Math.max(0, Math.ceil((goalWater * 1000 - totalWater * 1000) / 250))} glasses remaining</p>
            </button>

            <div className="grid grid-cols-4 gap-4 w-full">
              {[150, 250, 500, 750].map(amount => (
                <button 
                  key={amount}
                  onClick={() => addWater(amount)}
                  className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-primary/20 shadow-sm hover:bg-primary/5 transition-colors"
                >
                  <Droplets className="size-5 text-primary" />
                  <span className="text-xs font-black">{amount}ml</span>
                </button>
              ))}
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Bell className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Reminders</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Every 2 hours</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-primary rounded-full relative flex items-center px-1">
                  <div className="size-4 bg-white rounded-full ml-auto shadow-sm"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Target className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Daily Goal</p>
                    {editingGoal ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          value={tempGoal}
                          onChange={(e) => setTempGoal(e.target.value)}
                          className="w-16 border-b-2 border-primary outline-none text-xs font-bold bg-transparent"
                          autoFocus
                        />
                        <span className="text-xs text-slate-400">Liters</span>
                        <button onClick={saveGoal} className="text-primary font-bold text-xs bg-primary/10 px-2 py-1 rounded-full">Save</button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{goalWater} Liters ({Math.round(goalWater * 4)} glasses)</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setEditingGoal(true)}>
                  <ChevronRight className="size-5 text-slate-300" />
                </button>
              </div>
            </div>
          </section>
        </main>
        <NavBar active="hydration" />
      </div>
    );
  };

  const ProfileView = () => {
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState(state.profile.name);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          updateProfile({ profilePhoto: reader.result as string } as any);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleExportPDF = () => {
      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const totalCalories = state.meals.reduce((acc, m) => acc + m.calories, 0);
      const totalProtein = state.meals.reduce((acc, m) => acc + m.protein, 0);
      const totalCarbs = state.meals.reduce((acc, m) => acc + m.carbs, 0);
      const totalFats = state.meals.reduce((acc, m) => acc + m.fats, 0);

      const html = `
        <html>
        <head>
          <title>NutriAI Weekly Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1d1d15; }
            h1 { color: #aeaa4c; font-size: 28px; }
            h2 { color: #aeaa4c; font-size: 18px; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #aeaa4c; color: white; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .summary { background: #f7f7f6; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .stat { display: inline-block; margin-right: 30px; }
            .stat-value { font-size: 28px; font-weight: bold; color: #aeaa4c; }
            .stat-label { font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <h1>🥗 NutriAI Weekly Report</h1>
          <p>Generated on ${today} for <strong>${state.profile.name}</strong></p>
          <div class="summary">
            <div class="stat"><div class="stat-value">${totalCalories}</div><div class="stat-label">Total Calories</div></div>
            <div class="stat"><div class="stat-value">${totalProtein}g</div><div class="stat-label">Total Protein</div></div>
            <div class="stat"><div class="stat-value">${totalCarbs}g</div><div class="stat-label">Total Carbs</div></div>
            <div class="stat"><div class="stat-value">${totalFats}g</div><div class="stat-label">Total Fats</div></div>
          </div>
          <h2>Meal Log</h2>
          <table>
            <tr><th>Meal</th><th>Type</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fats</th><th>Time</th></tr>
            ${state.meals.map(m => `<tr>
              <td>${m.name}</td>
              <td>${m.type}</td>
              <td>${m.calories} kcal</td>
              <td>${m.protein}g</td>
              <td>${m.carbs}g</td>
              <td>${m.fats}g</td>
              <td>${new Date(m.timestamp).toLocaleString()}</td>
            </tr>`).join('')}
          </table>
          <h2>Profile</h2>
          <p>Daily Calorie Goal: <strong>${state.profile.dailyCalorieGoal} kcal</strong></p>
          <p>Biological Age: <strong>${state.profile.biologicalAge} years</strong></p>
          <p>Goal: <strong>${state.profile.goal}</strong></p>
        </body>
        </html>
      `;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'NutriAI-Report.html';
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto w-full">
          <button onClick={() => setView('dashboard')} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-lg font-black tracking-tight">Profile</h1>
          <button className="p-2 rounded-full hover:bg-primary/10 transition-colors">
            <Settings className="size-5 text-primary" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="size-32 rounded-full bg-primary/20 p-1 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden">
              <img 
                src={(state.profile as any).profilePhoto || "https://picsum.photos/seed/alex/300"} 
                alt="Profile" 
                className="size-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <button 
              onClick={() => photoInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-4 border-background-light dark:border-background-dark"
            >
              <Camera className="size-4" />
            </button>
            <input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" />
          </div>
          {editingName ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="text-xl font-black text-center border-b-2 border-primary outline-none bg-transparent"
                autoFocus
              />
              <button
                onClick={() => { updateProfile({ name: tempName }); setEditingName(false); }}
                className="text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded-full"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <h2 className="text-3xl font-black tracking-tight">{state.profile.name}</h2>
              <button onClick={() => setEditingName(true)} className="text-slate-400 hover:text-primary transition-colors">
                <Settings className="size-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Verified className="size-4 text-primary fill-primary" />
            <p className="text-primary text-xs font-black uppercase tracking-widest">Premium Member</p>
          </div>
          <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">Goal: {state.profile.goal} • Joined Jan 2024</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Avg Cal', value: '2,100' },
            { label: 'Avg Protein', value: '155g' },
            { label: 'Target', value: '65kg' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-primary/10 text-center shadow-sm">
              <p className="text-xl font-black tracking-tight">{stat.value}</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Preferences</h3>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-primary/10 overflow-hidden shadow-sm">
            <div className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="text-primary">
                  {darkMode ? <Moon className="size-5" /> : <Sun className="size-5" />}
                </div>
                <span className="font-bold text-sm">Dark Mode</span>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors ${darkMode ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}
                aria-label="Toggle Dark Mode"
              >
                <div className={`size-4 bg-white rounded-full shadow-sm transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Analytics & Export</h3>
          <button onClick={handleExportPDF} className="w-full bg-primary text-white p-5 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-between group transition-all active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <Download className="size-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Export Weekly Report</p>
                <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">HTML Format • All Data</p>
              </div>
            </div>
            <ChevronRight className="size-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-primary/10 overflow-hidden shadow-sm">
            {[
              { label: 'Full Meal History', icon: <History className="size-5" />, view: 'history' },
              { label: 'Weight & BMI Progress', icon: <Activity className="size-5" />, view: 'dashboard' },
              { label: 'Share Statistics', icon: <Share2 className="size-5" />, view: 'dashboard' },
            ].map((item, i) => (
              <button 
                key={item.label}
                onClick={() => setView(item.view)}
                className={`w-full flex items-center justify-between p-5 hover:bg-primary/5 transition-colors ${i !== 2 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-primary">{item.icon}</div>
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                <ChevronRight className="size-5 text-slate-300" />
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={resetData}
          className="w-full py-4 text-red-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors"
        >
          <Trash2 className="size-4" />
          Reset All Data
        </button>
      </main>
      <NavBar active="profile" />
    </div>
    );
  };

  const NavBar = ({ active }: { active: string }) => (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-primary/10 px-6 py-4 pb-8 flex justify-between items-center z-50">
      <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${active === 'home' ? 'text-primary' : 'text-slate-400'}`}>
        <Home className={`size-6 ${active === 'home' ? 'fill-primary' : ''}`} />
        <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
      </button>
      <button onClick={() => setView('history')} className={`flex flex-col items-center gap-1 ${active === 'history' ? 'text-primary' : 'text-slate-400'}`}>
        <Utensils className={`size-6 ${active === 'history' ? 'fill-primary' : ''}`} />
        <span className="text-[8px] font-black uppercase tracking-widest">Meals</span>
      </button>
      <div className="-mt-14">
        <button 
          onClick={() => setView('analysis')}
          className="size-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center border-4 border-background-light dark:border-background-dark transition-transform active:scale-90"
        >
          <Plus className="size-8" />
        </button>
      </div>
      <button onClick={() => setView('hydration')} className={`flex flex-col items-center gap-1 ${active === 'hydration' ? 'text-primary' : 'text-slate-400'}`}>
        <Droplets className={`size-6 ${active === 'hydration' ? 'fill-primary' : ''}`} />
        <span className="text-[8px] font-black uppercase tracking-widest">Water</span>
      </button>
      <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${active === 'profile' ? 'text-primary' : 'text-slate-400'}`}>
        <User className={`size-6 ${active === 'profile' ? 'fill-primary' : ''}`} />
        <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
      </button>
    </nav>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen shadow-2xl overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'splash' && <Splash />}
          {view === 'onboarding-1' && <Onboarding1 />}
          {view === 'onboarding-2' && <Onboarding2 />}
          {view === 'onboarding-3' && <Onboarding3 />}
          {view === 'onboarding-4' && <Onboarding4 />}
          {view === 'dashboard' && <Dashboard />}
          {view === 'analysis' && <Analysis />}
          {view === 'history' && <HistoryView />}
          {view === 'hydration' && <Hydration />}
          {view === 'profile' && <ProfileView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
