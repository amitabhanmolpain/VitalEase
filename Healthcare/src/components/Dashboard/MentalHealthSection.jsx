import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { doctors } from "../../constants";
import useGameStore from "../../store/gameStore";
import { 
  Heart, 
  Brain,
  MessageCircle,
  Send,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Calendar,
  Users,
  Phone,
  Video,
  X,
  Swords,
  Trophy,
  Zap,
  Award,
  Gamepad2,
  Target
} from "lucide-react";
import { assessmentAPI } from '../../services/assessmentApi';
import ApiEndpointsPanel from "../Dashboard/ApiEndpointsPanel";

const MentalHealthSection = ({ showGame, setShowGame, defaultTab = "assessment" }) => {
  // Check localStorage for assessment completion
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(() => {
    return localStorage.getItem('mentalHealthAssessmentCompleted') === 'true';
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [assessmentResults, setAssessmentResults] = useState(() => {
    const saved = localStorage.getItem('mentalHealthAssessmentResults');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState(() => {
    // If defaultTab is provided, use it; otherwise use results if completed, else assessment
    if (defaultTab !== "assessment") return defaultTab;
    return hasCompletedAssessment ? "results" : "assessment";
  });
  // Debounce for tab switching
  const [lastTabClick, setLastTabClick] = useState(0);
  const DEBOUNCE_TAB_MS = 200;
  const handleTabClick = (id) => {
    const now = Date.now();
    if (now - lastTabClick < DEBOUNCE_TAB_MS) return;
    setLastTabClick(now);
    setActiveTab(id);
  };
  const [journalEntry, setJournalEntry] = useState("");
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState(null); // kept for any other references, navigation handled by router
  const [backendAssessments, setBackendAssessments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const assessmentQuestions = [
    {
      id: 1,
      question: "How would you rate your overall mood over the past week?",
      type: "scale",
      options: ["Very Poor", "Poor", "Fair", "Good", "Excellent"],
      icon: Heart
    },
    {
      id: 2,
      question: "How well have you been sleeping lately?",
      type: "scale",
      options: ["Very Poor", "Poor", "Fair", "Good", "Excellent"],
      icon: Brain
    },
    {
      id: 3,
      question: "Do you feel stressed or overwhelmed?",
      type: "scale",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      icon: Brain
    },
    {
      id: 4,
      question: "How often do you engage in activities you enjoy?",
      type: "scale",
      options: ["Never", "Rarely", "Sometimes", "Often", "Daily"],
      icon: Heart
    },
    {
      id: 5,
      question: "How comfortable are you sharing your feelings with others?",
      type: "scale",
      options: ["Very Uncomfortable", "Uncomfortable", "Neutral", "Comfortable", "Very Comfortable"],
      icon: MessageCircle
    },
    {
      id: 6,
      question: "Have you experienced any significant life changes recently?",
      type: "yesno",
      options: ["Yes", "No"],
      icon: Brain
    },
    {
      id: 7,
      question: "Do you have a support system (family/friends) you can rely on?",
      type: "yesno",
      options: ["Yes", "No"],
      icon: Users
    }
  ];

  useEffect(() => {
    fetchBackendAssessments();
  }, []);

  const fetchBackendAssessments = async () => {
    setLoadingAssessments(true);
    try {
      const data = await assessmentAPI.getAssessments();
      setBackendAssessments(data.assessments || []);
    } catch (err) {
      toast.error('Failed to fetch previous assessments');
    }
    setLoadingAssessments(false);
  };

  const handleAnswerSelect = (answer) => {
    const newAnswers = { ...answers, [currentQuestion]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < assessmentQuestions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      // Calculate results
      calculateResults(newAnswers);
    }
  };

  const calculateResults = (finalAnswers) => {
    const scaleAnswers = Object.values(finalAnswers).slice(0, 5);
    const scaleValues = scaleAnswers.map(answer => {
      const scales = ["Very Poor", "Poor", "Fair", "Good", "Excellent", "Never", "Rarely", "Sometimes", "Often", "Always", "Daily", "Very Uncomfortable", "Uncomfortable", "Neutral", "Comfortable", "Very Comfortable"];
      return scales.indexOf(answer) % 5;
    });

    const averageScore = scaleValues.reduce((a, b) => a + b, 0) / scaleValues.length;
    
    let level = "";
    let recommendations = [];
    let color = "";

    if (averageScore >= 3.5) {
      level = "Great Mental Health";
      color = "green";
      recommendations = [
        "Continue your healthy lifestyle habits",
        "Maintain your support system connections",
        "Keep practicing self-care activities",
        "Consider helping others with mental health awareness"
      ];
    } else if (averageScore >= 2.5) {
      level = "Good with Room for Improvement";
      color = "blue";
      recommendations = [
        "Try incorporating daily mindfulness exercises",
        "Establish a consistent sleep schedule",
        "Engage in regular physical activity",
        "Consider talking to a counselor for additional support"
      ];
    } else if (averageScore >= 1.5) {
      level = "Moderate Concerns";
      color = "yellow";
      recommendations = [
        "We recommend speaking with a mental health professional",
        "Practice stress-reduction techniques daily",
        "Reach out to your support system regularly",
        "Consider joining a support group",
        "Prioritize self-care and rest"
      ];
    } else {
      level = "Needs Attention";
      color = "red";
      recommendations = [
        "Please consider scheduling an appointment with our mental health professionals",
        "Reach out to crisis support if you're feeling overwhelmed",
        "Don't hesitate to contact emergency services if needed",
        "Connect with your support system immediately",
        "Remember: seeking help is a sign of strength"
      ];
    }

    const results = {
      score: averageScore,
      level,
      color,
      recommendations
    };
    
    setAssessmentResults(results);
    setHasCompletedAssessment(true);
    setActiveTab("results");
    localStorage.setItem('mentalHealthAssessmentCompleted', 'true');
    localStorage.setItem('mentalHealthAssessmentResults', JSON.stringify(results));
    toast.success('Assessment completed successfully');

    // Submit assessment to backend
    submitAssessmentToBackend(finalAnswers, results);
  };

  const submitAssessmentToBackend = async (finalAnswers, results) => {
    try {
      const payload = {
        questions: assessmentQuestions,
        responses: Object.entries(finalAnswers).map(([idx, answer], i) => ({
          question_id: assessmentQuestions[i].id,
          answer,
          is_correct: null // Not scored per question, just overall
        })),
        score: results.score
      };
      await assessmentAPI.createAssessment(payload);
      fetchBackendAssessments();
    } catch (err) {
      toast.error('Failed to save assessment');
    }
  };

  const resetAssessment = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setAssessmentResults(null);
    setHasCompletedAssessment(false);
    setActiveTab("assessment");
    
    // Clear localStorage
    localStorage.removeItem('mentalHealthAssessmentCompleted');
    localStorage.removeItem('mentalHealthAssessmentResults');
  };

  const handleJournalSave = () => {
    if (journalEntry.trim()) {
      toast.success('Journal entry saved');
      setTimeout(() => {
        setJournalEntry("");
      }, 1000);
    }
  };

  const therapists = doctors.filter(
    (doc) => doc.specialty === "Psychiatrist" || doc.specialty === "Neurologist"
  );

  // Thought Battle Arena - Game Scenarios
  const battleScenarios = [
    {
      id: 1,
      situation: "I didn't get selected for the job interview.",
      negativeThought: "I will never be successful in life.",
      options: [
        { text: "Yes, I am a complete failure.", isCorrect: false, explanation: "This reinforces negative thinking and overgeneralization." },
        { text: "One rejection doesn't define my entire future.", isCorrect: true, explanation: "Perfect! This is a balanced, rational response that acknowledges the setback without catastrophizing." },
        { text: "I should stop trying.", isCorrect: false, explanation: "This promotes helplessness and giving up, which worsens depression." },
        { text: "Everyone else is better than me.", isCorrect: false, explanation: "This is comparison thinking that damages self-esteem." }
      ]
    },
    {
      id: 2,
      situation: "My friend didn't reply to my message for 2 days.",
      negativeThought: "Nobody cares about me. I'm completely alone.",
      options: [
        { text: "They might be busy or dealing with their own issues.", isCorrect: true, explanation: "Excellent! This considers alternative explanations instead of jumping to negative conclusions." },
        { text: "I knew I was unlovable.", isCorrect: false, explanation: "This is an extreme negative conclusion based on limited evidence." },
        { text: "I should just isolate myself from everyone.", isCorrect: false, explanation: "This promotes withdrawal, which can worsen mental health." },
        { text: "Everyone eventually abandons me.", isCorrect: false, explanation: "This is fortune-telling and overgeneralization based on one incident." }
      ]
    },
    {
      id: 3,
      situation: "I made a mistake during my presentation at work.",
      negativeThought: "I'm incompetent. My career is ruined.",
      options: [
        { text: "Everyone makes mistakes. I can learn from this.", isCorrect: true, explanation: "Great! This normalizes mistakes and focuses on growth." },
        { text: "I'm terrible at everything I do.", isCorrect: false, explanation: "This is all-or-nothing thinking that's not based in reality." },
        { text: "My boss will definitely fire me.", isCorrect: false, explanation: "This is catastrophizing without evidence." },
        { text: "I should never speak in public again.", isCorrect: false, explanation: "This is avoidance behavior that limits your growth." }
      ]
    },
    {
      id: 4,
      situation: "I feel anxious about an upcoming exam.",
      negativeThought: "I'm going to fail and disappoint everyone.",
      options: [
        { text: "I've prepared as best as I could. I'll do my best.", isCorrect: true, explanation: "Perfect! This acknowledges your effort and focuses on what you can control." },
        { text: "I always mess up important things.", isCorrect: false, explanation: "This overgeneralizes past experiences and creates unnecessary pressure." },
        { text: "Everyone will think I'm stupid if I fail.", isCorrect: false, explanation: "This is mind-reading and assumes others' thoughts negatively." },
        { text: "There's no point in even trying.", isCorrect: false, explanation: "This promotes defeatism and prevents you from trying your best." }
      ]
    },
    {
      id: 5,
      situation: "Someone criticized my work.",
      negativeThought: "I'm worthless. I can't do anything right.",
      options: [
        { text: "Feedback helps me improve. Not everyone will like everything I do.", isCorrect: true, explanation: "Excellent! This reframes criticism as an opportunity for growth." },
        { text: "This proves I'm a failure.", isCorrect: false, explanation: "This is labeling yourself negatively based on one opinion." },
        { text: "I should quit because I'm not good enough.", isCorrect: false, explanation: "This is giving up instead of learning and improving." },
        { text: "That person must hate me.", isCorrect: false, explanation: "This personalizes professional feedback and jumps to conclusions." }
      ]
    },
    {
      id: 6,
      situation: "I feel left out because I wasn't invited to a party.",
      negativeThought: "Nobody likes me. I'm a social outcast.",
      options: [
        { text: "Maybe they had limited space, or I can reach out and connect.", isCorrect: true, explanation: "Great! This considers alternatives and focuses on proactive solutions." },
        { text: "I'm too boring for anyone to want me around.", isCorrect: false, explanation: "This is self-labeling and harsh self-judgment." },
        { text: "I should never try to socialize again.", isCorrect: false, explanation: "This promotes isolation which can worsen loneliness." },
        { text: "Everyone must be talking about how weird I am.", isCorrect: false, explanation: "This is mind-reading and paranoia without evidence." }
      ]
    },
    {
      id: 7,
      situation: "I've been feeling tired and unmotivated lately.",
      negativeThought: "I'm lazy and will never achieve my goals.",
      options: [
        { text: "I might need rest or should check if something else is affecting my energy.", isCorrect: true, explanation: "Perfect! This shows self-compassion and looks for root causes." },
        { text: "I'm a lazy person who will never succeed.", isCorrect: false, explanation: "This is harsh labeling that ignores context and your overall efforts." },
        { text: "Successful people don't feel tired.", isCorrect: false, explanation: "This is an unrealistic standard. Everyone experiences fatigue." },
        { text: "I should just give up on my dreams.", isCorrect: false, explanation: "This is defeatist thinking triggered by temporary low energy." }
      ]
    },
    {
      id: 8,
      situation: "I compared myself to someone successful on social media.",
      negativeThought: "I'm so far behind. I'll never reach their level.",
      options: [
        { text: "Everyone has their own timeline. I'm on my own unique journey.", isCorrect: true, explanation: "Excellent! This prevents harmful comparisons and acknowledges individual paths." },
        { text: "I'm a complete loser compared to them.", isCorrect: false, explanation: "This is comparison trap and ignores your own achievements." },
        { text: "I should give up because I can't compete.", isCorrect: false, explanation: "This turns life into a competition and promotes giving up." },
        { text: "Social media shows everyone is better than me.", isCorrect: false, explanation: "This ignores that social media shows curated highlights, not reality." }
      ]
    }
  ];

  const selfCareActivities = [
    { id: 1, title: "5-Minute Breathing", icon: Brain, duration: "5 min", description: "Deep breathing exercises" },
    { id: 2, title: "Guided Meditation", icon: Heart, duration: "10 min", description: "Calm your mind" },
    { id: 3, title: "Gratitude Exercise", icon: CheckCircle, duration: "5 min", description: "Count your blessings" },
    { id: 4, title: "Body Scan Relaxation", icon: Brain, duration: "15 min", description: "Full body awareness" },
  ];

  const journalPrompts = [
    "What are three things you're grateful for today?",
    "Describe a challenge you overcame recently",
    "What does self-care mean to you?",
    "Write a letter of compassion to yourself"
  ];

  const supportResources = [
    {
      id: 1,
      title: "24/7 Crisis Helpline",
      description: "Immediate support when you need it most",
      contact: "1-800-273-8255",
      icon: Phone,
      color: "from-red-500 to-pink-500",
    },
    {
      id: 2,
      title: "Text Support",
      description: "Text HOME to 741741 for crisis support",
      contact: "741741",
      icon: MessageCircle,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 3,
      title: "Online Chat Support",
      description: "Connect with a counselor online",
      contact: "Available 24/7",
      icon: Video,
      color: "from-green-500 to-emerald-500",
    },
  ];

  // Therapist Detail Modal
  if (selectedTherapist) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-purple-800/95 backdrop-blur-md rounded-2xl max-w-2xl w-full border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <button
              onClick={() => setSelectedTherapist(null)}
              className="float-right text-gray-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
            
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                <img
                  src={selectedTherapist.img}
                  alt={selectedTherapist.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="flex-1">
                <h2 className="font-poppins font-bold text-3xl text-white mb-2">
                  {selectedTherapist.name}
                </h2>
                <p className="text-blue-400 text-lg mb-3">{selectedTherapist.specialty}</p>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={18} className="text-green-400" />
                  <span className="text-gray-300">Licensed Professional</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 flex items-center gap-1">
                    <CheckCircle size={16} />
                    4.9
                  </span>
                  <span className="text-gray-400">• 150+ Sessions</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-white text-lg mb-3">About</h3>
                <p className="text-gray-300 leading-relaxed">
                  With over 10 years of experience in mental health care, specializing in cognitive behavioral therapy,
                  anxiety management, and depression treatment. Committed to providing compassionate, evidence-based care
                  to help you achieve your mental wellness goals.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white text-lg mb-3">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {["Anxiety", "Depression", "Stress Management", "PTSD", "Relationship Issues"].map((spec, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-sm border border-blue-500/30">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white text-lg mb-3">Education</h3>
                <p className="text-gray-300">• Ph.D. in Clinical Psychology</p>
                <p className="text-gray-300">• Licensed Mental Health Counselor</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold hover:shadow-lg transition flex items-center justify-center gap-2">
                  <Calendar size={20} />
                  Book Session
                </button>
                <button className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition border border-white/20 flex items-center justify-center gap-2">
                  <MessageCircle size={20} />
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Games are now full-page routes — navigate there instead of rendering inline

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-2xl p-8 backdrop-blur-sm border border-pink-500/20 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <Heart size={32} className="text-pink-400" />
          <h1 className="font-poppins font-bold text-4xl text-white">
            Mental Health & Wellness
          </h1>
        </div>
        <p className="text-gray-200 text-lg">
          You're not alone. We're here to support your mental well-being journey.
        </p>
      </div>

      {/* Tabs */}
      {hasCompletedAssessment && activeTab !== "leaderboard" && (
        <div className="flex flex-wrap gap-2">
          {[
            { id: "results", label: "Your Results", icon: Lightbulb },
            { id: "games", label: "Mental Health Games", icon: Gamepad2 },
            { id: "support", label: "Support Resources", icon: Heart },
            { id: "self-care", label: "Self-Care", icon: Brain },
            { id: "journal", label: "Journal", icon: MessageCircle },
            { id: "therapists", label: "Talk to Someone", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                    : "bg-white/5 text-gray-300 hover:text-white border border-white/10"
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Assessment Section */}
      {!hasCompletedAssessment && activeTab === "assessment" && activeTab !== "leaderboard" && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Question {currentQuestion + 1} of {assessmentQuestions.length}</span>
                <span className="text-blue-400 font-medium">{Math.round(((currentQuestion + 1) / assessmentQuestions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-purple-700/30 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / assessmentQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {assessmentQuestions[currentQuestion] && (
              <div className="text-center animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-6">
                  {(() => {
                    const Icon = assessmentQuestions[currentQuestion].icon;
                    return <Icon size={32} className="text-pink-400" />;
                  })()}
                </div>
                <h3 className="font-poppins font-semibold text-2xl text-white mb-8">
                  {assessmentQuestions[currentQuestion].question}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {assessmentQuestions[currentQuestion].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(option)}
                      className="p-4 rounded-xl bg-purple-700/30 hover:bg-purple-600/50 border border-white/10 hover:border-pink-500/50 text-white transition-all hover:scale-105"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {activeTab === "results" && assessmentResults && (
        <div className="space-y-6">
          <div className={`bg-gradient-to-r ${
            assessmentResults.color === 'green' ? 'from-green-600/20 to-emerald-600/20 border-green-500/20' :
            assessmentResults.color === 'blue' ? 'from-blue-600/20 to-cyan-600/20 border-blue-500/20' :
            assessmentResults.color === 'yellow' ? 'from-yellow-600/20 to-orange-600/20 border-yellow-500/20' :
            'from-red-600/20 to-pink-600/20 border-red-500/20'
          } rounded-2xl p-8 backdrop-blur-sm border shadow-lg`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-full ${
                assessmentResults.color === 'green' ? 'bg-green-500/20' :
                assessmentResults.color === 'blue' ? 'bg-blue-500/20' :
                assessmentResults.color === 'yellow' ? 'bg-yellow-500/20' :
                'bg-red-500/20'
              } flex items-center justify-center`}>
                <Lightbulb size={32} className={`${
                  assessmentResults.color === 'green' ? 'text-green-400' :
                  assessmentResults.color === 'blue' ? 'text-blue-400' :
                  assessmentResults.color === 'yellow' ? 'text-yellow-400' :
                  'text-red-400'
                }`} />
              </div>
              <div>
                <h2 className="font-poppins font-bold text-3xl text-white">{assessmentResults.level}</h2>
                <p className="text-gray-200">Based on your assessment</p>
              </div>
            </div>
            
            <div className="space-y-3 mt-6">
              <h3 className="font-semibold text-white text-lg mb-4">Personalized Recommendations:</h3>
              {assessmentResults.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 text-gray-200">
                  <CheckCircle size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>

            <button
              onClick={resetAssessment}
              className="mt-6 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition border border-white/20"
            >
              Retake Assessment
            </button>
          </div>

          {/* Crisis Support */}
          {assessmentResults.color === 'red' && (
            <>
              <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6">
                <h3 className="font-poppins font-semibold text-xl text-white mb-4 flex items-center gap-2">
                  <Phone size={24} className="text-red-400" />
                  Immediate Support Available
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {supportResources.map((resource) => {
                    const Icon = resource.icon;
                    return (
                      <div key={resource.id} className={`bg-gradient-to-br ${resource.color} rounded-xl p-4 text-white`}>
                        <Icon size={32} className="mb-2" />
                        <h4 className="font-semibold">{resource.title}</h4>
                        <p className="text-sm opacity-90 mb-2">{resource.description}</p>
                        <p className="font-bold text-lg">{resource.contact}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Games Section */}
      {activeTab === "games" && hasCompletedAssessment && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-8 backdrop-blur-sm border border-purple-500/20 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <Gamepad2 size={32} className="text-purple-400" />
              <h2 className="font-poppins font-bold text-3xl text-white">
                Mental Health Games
              </h2>
            </div>
            <p className="text-gray-200 text-lg">
              Build resilience and challenge negative thoughts through interactive, evidence-based games.
            </p>
          </div>

          {/* Game Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Thought Battle Game Card */}
            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-8 backdrop-blur-sm border border-purple-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Swords size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-2xl text-white">Thought Battle Arena</h3>
                  <p className="text-purple-300">CBT-Based Combat Game</p>
                </div>
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">
                Face negative thought monsters and defeat them by choosing healthy, rational responses based on Cognitive Behavioral Therapy principles.
              </p>

              <div className="bg-purple-700/30 rounded-xl p-4 mb-6">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-400" />
                  Game Features:
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Zap size={14} className="text-blue-400" />
                    <span>Earn XP & Level Up</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Award size={14} className="text-green-400" />
                    <span>Unlock Badges</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Brain size={14} className="text-pink-400" />
                    <span>Learn CBT Skills</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Trophy size={14} className="text-yellow-400" />
                    <span>Track Streaks</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/games/thought-battle')}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white font-bold text-lg hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Swords size={24} />
                Start Battle
              </button>
            </div>


            {/* Thought Reframer Card */}
            <div className="bg-gradient-to-br from-indigo-900/50 to-teal-900/50 rounded-2xl p-8 backdrop-blur-sm border border-teal-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-2xl text-white">Thought Reframer</h3>
                  <p className="text-teal-300">CBT Cognitive Exercises</p>
                </div>
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">
                Deconstruct automated negative thought patterns. Select a distortion type, analyze its core flaws, and write balanced reframes to weaken it.
              </p>

              <div className="bg-teal-700/30 rounded-xl p-4 mb-6">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-400" />
                  Game Features:
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Brain size={14} className="text-purple-400" />
                    <span>5 Distortions</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Lightbulb size={14} className="text-yellow-400" />
                    <span>AI Reflection</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Heart size={14} className="text-red-400" />
                    <span>Mindful Settle</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle size={14} className="text-blue-400" />
                    <span>Evidence-Based</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/games/reframe')}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-xl text-slate-950 font-bold text-lg hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Brain size={24} />
                Start Reframing
              </button>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl p-6 backdrop-blur-sm border border-green-500/20 shadow-lg">
            <h3 className="font-poppins font-semibold text-xl text-white mb-4 flex items-center gap-2">
              <Brain size={24} className="text-green-400" />
              Why Gamification Works for Mental Health
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Evidence-Based</h4>
                  <p className="text-gray-300 text-sm">Built on proven CBT and positive psychology principles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Engaging & Fun</h4>
                  <p className="text-gray-300 text-sm">Makes mental health practices more accessible and enjoyable</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-1">Track Progress</h4>
                  <p className="text-gray-300 text-sm">Visual feedback and achievements keep you motivated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Resources Tab */}
      {activeTab === "support" && hasCompletedAssessment && (
        <div className="space-y-6">
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6">
            <h3 className="font-poppins font-semibold text-xl text-white mb-4 flex items-center gap-2">
              <Phone size={24} className="text-red-400" />
              If You're in Crisis
            </h3>
            <p className="text-gray-300 mb-4">
              If you're having thoughts of self-harm or suicide, please reach out immediately:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {supportResources.map((resource) => {
                const Icon = resource.icon;
                return (
                  <div key={resource.id} className={`bg-gradient-to-br ${resource.color} rounded-xl p-4 text-white`}>
                    <Icon size={32} className="mb-2" />
                    <h4 className="font-semibold">{resource.title}</h4>
                    <p className="text-sm opacity-90 mb-2">{resource.description}</p>
                    <p className="font-bold text-lg">{resource.contact}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Self-Care Tab */}
      {activeTab === "self-care" && hasCompletedAssessment && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
          <h3 className="font-poppins font-semibold text-xl text-white mb-4">
            Self-Care Activities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {selfCareActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <button
                  key={activity.id}
                  className="p-4 bg-purple-700/30 rounded-xl hover:bg-purple-600/50 transition text-left group border border-white/10 hover:border-pink-500/50"
                >
                  <Icon size={32} className="text-pink-400 mb-3 group-hover:scale-110 transition" />
                  <h4 className="text-white font-semibold mb-1">{activity.title}</h4>
                  <p className="text-gray-400 text-sm mb-2">{activity.description}</p>
                  <span className="text-blue-400 text-sm">{activity.duration}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Journal Tab */}
      {activeTab === "journal" && hasCompletedAssessment && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
            <h3 className="font-poppins font-semibold text-xl text-white mb-4">
              Today's Journal Entry
            </h3>
            <textarea
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="How are you feeling? What's on your mind today?"
              className="w-full h-48 px-4 py-3 rounded-xl bg-purple-700/30 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 transition resize-none"
            />
            <div className="flex justify-between items-center mt-4">
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                Your journal entries are private and secure
              </p>
              <button
                onClick={handleJournalSave}
                disabled={!journalEntry.trim()}
                className={`px-6 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
                  journalEntry.trim()
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg"
                    : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Send size={18} />
                Save Entry
              </button>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
            <h3 className="font-poppins font-semibold text-xl text-white mb-4">
              Journal Prompts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {journalPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setJournalEntry(prompt + "\n\n")}
                  className="text-left p-4 bg-purple-700/30 rounded-xl hover:bg-purple-600/50 transition border border-white/10 hover:border-pink-500/50 group"
                >
                  <ArrowRight size={18} className="text-pink-400 mb-2 group-hover:translate-x-1 transition" />
                  <p className="text-white">{prompt}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <LeaderboardSection />
      )}

      {/* Therapists Tab */}
      {activeTab === "therapists" && hasCompletedAssessment && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
            <h3 className="font-poppins font-semibold text-xl text-white mb-2">
              Talk to a Mental Health Professional
            </h3>
            <p className="text-gray-300 mb-6">
              Our licensed therapists and psychiatrists are here to help you navigate through difficult times.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {therapists.map((therapist) => (
                <div
                  key={therapist.id}
                  onClick={() => setSelectedTherapist(therapist)}
                  className="flex items-center gap-4 p-4 bg-purple-700/30 rounded-xl hover:bg-purple-600/50 transition cursor-pointer border border-white/10 hover:border-pink-500/50 group"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                    <img
                      src={therapist.img}
                      alt={therapist.name}
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{therapist.name}</h4>
                    <p className="text-gray-300 text-sm">{therapist.specialty}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-yellow-400 text-sm flex items-center gap-1">
                        <CheckCircle size={14} />
                        4.9
                      </span>
                      <span className="text-gray-400 text-sm">• Available</span>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-pink-400 group-hover:translate-x-1 transition" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Leaderboard Section Component
import { statsAPI } from "../../services/statsApi";

const LeaderboardSection = () => {
  const [stats, setStats] = useState({});
  const [games, setGames] = useState({});
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await statsAPI.getStats();
        setStats(data?.global_stats || {});
        setGames(data?.games || {});
        setAchievements(data?.achievements || []);
      } catch (e) {
        console.error("Stats API error:", e);
        setStats({});
        setGames({});
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // helpers
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfWeek = (y, m) => new Date(y, m, 1).getDay();
  const getToday = () => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), date: d.getDate() };
  };

  const today = getToday();
  const daysInMonth = getDaysInMonth(month.year, month.month);

  // hooks ALWAYS run
  // Build activity map from real data and calculate current streak
  const [currentStreak, setCurrentStreak] = useState(0);
  const activityMap = useMemo(() => {
    let activityLog = [];
    if (stats && stats.activity_log) {
      activityLog = stats.activity_log;
    } else if (games) {
      Object.values(games).forEach(g => {
        if (g && Array.isArray(g.activity_log)) {
          activityLog = activityLog.concat(g.activity_log);
        }
      });
    }
    // Convert to set of YYYY-MM-DD strings
    const playedSet = new Set(activityLog.map(date => {
      if (typeof date === 'string') return date;
      if (date && date.date) return date.date;
      return '';
    }));
    // Build map for calendar
    const map = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(month.year, month.month, d);
      const dateStr = dateObj.toISOString().slice(0, 10);
      map[d] = playedSet.has(dateStr);
    }
    // Calculate current streak (consecutive days up to today)
    let streak = 0;
    const today = new Date();
    for (let i = 0; ; i++) {
      const checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const checkStr = checkDate.toISOString().slice(0, 10);
      if (playedSet.has(checkStr)) {
        streak++;
      } else {
        break;
      }
    }
    setCurrentStreak(streak);
    return map;
  }, [daysInMonth, month, stats, games]);

  const calendarDays = useMemo(() => {
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(month.year, month.month, d);
      list.push({
        date: d,
        dayName: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
        hasActivity: activityMap[d],
        isToday:
          today.year === month.year &&
          today.month === month.month &&
          today.date === d,
      });
    }
    return list;
  }, [month, daysInMonth, activityMap, today]);

  // SAFE stats
  const level = typeof stats.level === "number" ? stats.level : 1;
  const xp = typeof stats.xp === "number" ? stats.xp : 0;
  const victories = typeof stats.victories === "number" ? stats.victories : 0;
  const losses = typeof stats.losses === "number" ? stats.losses : 0;
  const streak =
    typeof stats.current_streak === "number" ? stats.current_streak : 0;
  const winRate = typeof stats.win_rate === "number" ? stats.win_rate : 0;

  const highestStreak =
    typeof stats.highest_streak === "number"
      ? stats.highest_streak
      : streak;

  const xpProgress = xp % 100;
  const xpToNextLevel = level * 100 - xp;
  const totalBattles = victories + losses;

  // ONLY JSX below
  if (loading)
    return <div className="text-white">Loading leaderboard...</div>;

  return (

    <div className="space-y-6">
      {/* Top Stats Card - Combined Level & XP */}
      <div className="bg-gradient-to-r from-red-500/20 via-green-500/20 to-blue-600/20 border border-yellow-500/30 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 via-green-400 to-blue-400 flex items-center justify-center shadow-lg">
              {/* Combination icon: 3 game icons */}
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">⚔️</span>
                <span className="text-2xl mb-1">🌟</span>
                <span className="text-2xl">🎭</span>
              </div>
            </div>
            <div>
              <h2 className="font-poppins font-bold text-4xl text-white">Combined Level {level}</h2>
              <p className="text-gray-300">This level bar is a combination of all three games' levels</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Total XP</p>
            <p className="text-white font-bold text-3xl">{xp}</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Progress to Level {level + 1} (Combined)</span>
            <span className="text-yellow-400 font-semibold">{xpProgress} / 100 XP</span>
          </div>
          <div className="w-full bg-purple-700/30 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-red-400 via-green-400 to-blue-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            ></div>
          </div>
          <p className="text-gray-400 text-xs">{xpToNextLevel} XP needed for next level (sum of all games)</p>
        </div>
      </div>

      {/* Game Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <Swords size={32} className="text-purple-400 mb-2" />
          <p className="text-gray-300 text-sm">Total Battles</p>
          <p className="text-white font-bold text-3xl">{totalBattles}</p>
        </div>
        
        <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-6">
          <Trophy size={32} className="text-green-400 mb-2" />
          <p className="text-gray-300 text-sm">Victories</p>
          <p className="text-white font-bold text-3xl">{victories}</p>
        </div>
        
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <Zap size={32} className="text-blue-400 mb-2" />
          <p className="text-gray-300 text-sm">Current Streak</p>
          <p className="text-white font-bold text-3xl">{streak}</p>
        </div>
        
        <div className="bg-orange-600/20 border border-orange-500/30 rounded-xl p-6">
          <Award size={32} className="text-orange-400 mb-2" />
          <p className="text-gray-300 text-sm">Win Rate</p>
          <p className="text-white font-bold text-3xl">{winRate}%</p>
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar size={32} className="text-pink-400" />
            <div>
              <h3 className="font-poppins font-semibold text-2xl text-white">Activity Streak</h3>
              <p className="text-gray-300">{new Date(month.year, month.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Current Streak</p>
            <p className="text-yellow-400 font-bold text-2xl">{currentStreak} days 🔥</p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-3">
          {calendarDays.map((day, idx) => (
            <div key={idx} className="relative">
              <div
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                  day.hasActivity
                    ? day.isToday
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg scale-110'
                      : 'bg-gradient-to-br from-green-500/70 to-emerald-500/70 hover:scale-105'
                    : 'bg-purple-700/20 border border-white/10'
                }`}
              >
                <span className={`text-xs font-medium ${
                  day.hasActivity ? 'text-white' : 'text-gray-400'
                }`}>
                  {day.dayName.slice(0, 1)}
                </span>
                <span className={`text-lg font-bold ${
                  day.hasActivity ? 'text-white' : 'text-gray-500'
                }`}>
                  {day.date}
                </span>
              </div>
              {day.isToday && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded"></div>
            <span className="text-gray-300">Played</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded"></div>
            <span className="text-gray-300">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-700/20 border border-white/10 rounded"></div>
            <span className="text-gray-300">Not Played</span>
          </div>
        </div>
      </div>

      {/* Game Levels Scoreboard */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Target size={32} className="text-green-400" />
          <h3 className="font-poppins font-semibold text-2xl text-white">Game Levels Scoreboard</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Thought Battle */}
          <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">⚔️</span>
            </div>
            <h4 className="text-white font-bold text-xl mb-2">Thought Battle</h4>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">Level</p>
              <p className="text-white font-bold text-4xl">{games.thoughtbattle?.level || 1}</p>
              <p className="text-gray-400 text-sm">XP: {games.thoughtbattle?.xp || 0}</p>
              <p className="text-gray-400 text-sm">Wins: {games.thoughtbattle?.victories || 0}</p>
            </div>
          </div>

          {/* Life Quest */}
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">🌟</span>
            </div>
            <h4 className="text-white font-bold text-xl mb-2">Life Quest</h4>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">Level</p>
              <p className="text-white font-bold text-4xl">{games.lifequest?.level || 1}</p>
              <p className="text-gray-400 text-sm">XP: {games.lifequest?.xp || 0}</p>
              <p className="text-gray-400 text-sm">Wins: {games.lifequest?.victories || 0}</p>
            </div>
          </div>

          {/* Emotion Quest */}
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">🎭</span>
            </div>
            <h4 className="text-white font-bold text-xl mb-2">Emotion Quest</h4>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">Level</p>
              <p className="text-white font-bold text-4xl">{games.emotionquest?.level || 1}</p>
              <p className="text-gray-400 text-sm">XP: {games.emotionquest?.xp || 0}</p>
              <p className="text-gray-400 text-sm">Wins: {games.emotionquest?.victories || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section in Leaderboard */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Award size={32} className="text-purple-400" />
          <h3 className="font-poppins font-semibold text-2xl text-white">Achievements Unlocked</h3>
        </div>

        {achievements.length > 0 ? (
          <div className="space-y-6">
            {/* Group achievements by game */}
            {(() => {
              const gameGroups = achievements.reduce((groups, achievement) => {
                const game = achievement.game || 'global';
                if (!groups[game]) groups[game] = [];
                groups[game].push(achievement);
                return groups;
              }, {});

              const gameDisplayNames = {
                'global': '🏆 Global Achievements',
                'thoughtbattle': '⚔️ Thought Battle',
                'lifequest': '🌟 Life Quest',
                'emotionquest': '🎭 Emotion Quest'
              };

              return Object.entries(gameGroups).map(([gameKey, gameAchievements]) => {
                // Unique badge icons and badge shapes for each game
                const badgeIcons = {
                  thoughtbattle: (
                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                      {/* Target with arrow for Thought Battle */}
                      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="30" fill="#FF6B6B" stroke="#fff" strokeWidth="4"/>
                        <circle cx="32" cy="32" r="18" fill="#fff" stroke="#FFD93D" strokeWidth="3"/>
                        <path d="M44 20L32 32" stroke="#6366F1" strokeWidth="3" strokeLinecap="round"/>
                        <polygon points="44,20 40,22 42,24" fill="#6366F1"/>
                        <text x="32" y="58" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">Thought Battle</text>
                      </svg>
                    </div>
                  ),
                  lifequest: (
                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                      {/* Star badge for Life Quest (fixed SVG) */}
                      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <polygon points="32,10 39,26 58,26 42,38 48,54 32,45 16,54 22,38 6,26 25,26" fill="#43E97B" stroke="#fff" strokeWidth="3"/>
                        <circle cx="32" cy="34" r="10" fill="#fff" stroke="#38BDF8" strokeWidth="2"/>
                        <text x="32" y="39" textAnchor="middle" fontSize="14" fill="#38BDF8" fontWeight="bold">LQ</text>
                        <text x="32" y="60" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">Life Quest</text>
                      </svg>
                    </div>
                  ),
                  emotionquest: (
                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                      {/* Mask badge for Emotion Quest */}
                      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <ellipse cx="32" cy="32" rx="28" ry="24" fill="#7C3AED" stroke="#fff" strokeWidth="4"/>
                        <ellipse cx="32" cy="32" rx="14" ry="10" fill="#fff" stroke="#F472B6" strokeWidth="2"/>
                        <ellipse cx="26" cy="32" rx="2" ry="3" fill="#7C3AED"/>
                        <ellipse cx="38" cy="32" rx="2" ry="3" fill="#7C3AED"/>
                        <path d="M28 38 Q32 42 36 38" stroke="#F472B6" strokeWidth="2" fill="none"/>
                        <text x="32" y="58" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">Emotion Quest</text>
                      </svg>
                    </div>
                  ),
                  global: (
                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                      {/* Trophy for global */}
                      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="30" fill="#FBBF24" stroke="#fff" strokeWidth="4"/>
                        <rect x="22" y="22" width="20" height="20" rx="4" fill="#fff" stroke="#6366F1" strokeWidth="2"/>
                        <circle cx="32" cy="32" r="6" fill="#6366F1"/>
                        <text x="32" y="58" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">Global</text>
                      </svg>
                    </div>
                  )
                };

                const getGameStyles = (game) => {
                  switch(game) {
                    case 'thoughtbattle':
                      return {
                        bg: 'bg-gradient-to-br from-red-600/30 to-orange-600/30',
                        border: 'border-red-500/50',
                        icon: badgeIcons.thoughtbattle
                      };
                    case 'lifequest':
                      return {
                        bg: 'bg-gradient-to-br from-green-600/30 to-emerald-600/30',
                        border: 'border-green-500/50',
                        icon: badgeIcons.lifequest
                      };
                    case 'emotionquest':
                      return {
                        bg: 'bg-gradient-to-br from-blue-600/30 to-purple-600/30',
                        border: 'border-blue-500/50',
                        icon: badgeIcons.emotionquest
                      };
                    default: // global
                      return {
                        bg: 'bg-gradient-to-br from-purple-600/30 to-pink-600/30',
                        border: 'border-purple-500/50',
                        icon: badgeIcons.global
                      };
                  }
                };

                const styles = getGameStyles(gameKey);

                return (
                  <div key={gameKey} className="space-y-4">
                    <h4 className="text-white font-semibold text-lg flex items-center gap-2">
                      {gameDisplayNames[gameKey] || gameKey}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {gameAchievements.map((achievement, idx) => (
                        <div
                          key={idx}
                          className={`${styles.bg} border ${styles.border} rounded-xl p-4 text-center hover:scale-105 transition`}
                        >
                          {styles.icon}
                          <p className="text-white font-semibold text-sm mt-2">{achievement.title}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(achievement.earned_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy size={48} className="text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No achievements earned yet. Keep playing games to unlock them!</p>
          </div>
        )}
      </div>

{/* Achievements Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Award size={32} className="text-purple-400" />
          <h3 className="font-poppins font-semibold text-2xl text-white">Achievements Unlocked</h3>
        </div>

        {achievements.length > 0 ? (
          <div className="space-y-6">
            {/* Group achievements by game */}
            {(() => {
              const gameGroups = achievements.reduce((groups, achievement) => {
                const game = achievement.game || 'global';
                if (!groups[game]) groups[game] = [];
                groups[game].push(achievement);
                return groups;
              }, {});

              const gameDisplayNames = {
                'global': '🏆 Global Achievements',
                'thoughtbattle': '⚔️ Thought Battle',
                'lifequest': '🌟 Life Quest',
                'emotionquest': '🎭 Emotion Quest'
              };

              return Object.entries(gameGroups).map(([gameKey, gameAchievements]) => {
                const getGameStyles = (game) => {
                  switch(game) {
                    case 'thoughtbattle':
                      return {
                        bg: 'bg-gradient-to-br from-red-600/30 to-orange-600/30',
                        border: 'border-red-500/50',
                        iconBg: 'from-red-400 to-orange-500',
                        icon: '⚔️'
                      };
                    case 'lifequest':
                      return {
                        bg: 'bg-gradient-to-br from-green-600/30 to-emerald-600/30',
                        border: 'border-green-500/50',
                        iconBg: 'from-green-400 to-emerald-500',
                        icon: '🌟'
                      };
                    case 'emotionquest':
                      return {
                        bg: 'bg-gradient-to-br from-blue-600/30 to-purple-600/30',
                        border: 'border-blue-500/50',
                        iconBg: 'from-blue-400 to-purple-500',
                        icon: '🎭'
                      };
                    default: // global
                      return {
                        bg: 'bg-gradient-to-br from-purple-600/30 to-pink-600/30',
                        border: 'border-purple-500/50',
                        iconBg: 'from-yellow-400 to-orange-500',
                        icon: '🏆'
                      };
                  }
                };

                const styles = getGameStyles(gameKey);

                return (
                  <div key={gameKey} className="space-y-4">
                    <h4 className="text-white font-semibold text-lg flex items-center gap-2">
                      <span className="text-2xl">{styles.icon}</span>
                      {gameDisplayNames[gameKey] || gameKey}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {gameAchievements.map((achievement, idx) => (
                        <div
                          key={idx}
                          className={`${styles.bg} border ${styles.border} rounded-xl p-4 text-center hover:scale-105 transition`}
                        >
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${styles.iconBg} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                            <Trophy size={32} className="text-white" />
                          </div>
                          <p className="text-white font-semibold text-sm">{achievement.title}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(achievement.earned_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy size={48} className="text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No achievements earned yet. Keep playing games to unlock them!</p>
          </div>
        )}
      </div>

      {/* Motivational Message */}
      <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30 rounded-2xl p-6 text-center">
        <h3 className="text-white font-bold text-xl mb-2">
          {streak >= 7 ? "Amazing commitment! 🌟" : 
           streak >= 3 ? "Keep the momentum going! 💪" :
           totalBattles >= 5 ? "You're making great progress! 🎯" :
           "Start your journey to mental wellness! 🚀"}
        </h3>
        <p className="text-gray-300">
          {streak >= 7 ? "Your consistency is inspiring. Mental health is a journey, not a destination." :
           streak >= 3 ? "Building healthy habits one day at a time. You're doing great!" :
           totalBattles >= 5 ? "Every battle won is a step toward better mental health." :
           "Challenge negative thoughts and build resilience through gameplay."}
        </p>
      </div>

      {/* API Endpoints Reference */}
      <ApiEndpointsPanel
        title="Mental Health — API Endpoints"
        endpoints={[
          { method: "GET",    path: "/api/assessments",          description: "User’s assessment history" },
          { method: "POST",   path: "/api/assessments",          description: "Submit a new assessment" },
          { method: "GET",    path: "/api/assessments/:id",      description: "Get a specific assessment" },
          { method: "PUT",    path: "/api/assessments/:id",      description: "Update an assessment" },
          { method: "DELETE", path: "/api/assessments/:id",      description: "Delete an assessment" },
          { method: "WS",     path: "ws://server/socket.io",     description: "Real-time game events (SocketIO)" },
          { method: "GET",    path: "/api/reframe/distortions",  description: "Cognitive distortion list" },
          { method: "POST",   path: "/api/reframe/session",      description: "Start a Thought Reframer session" },
          { method: "GET",    path: "/api/player/stats",         description: "Player XP, level & stats" },
        ]}
      />
    </div>
  );
};

export default MentalHealthSection;
