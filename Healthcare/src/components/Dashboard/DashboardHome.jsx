import { useState, useEffect } from "react";
import { doctorAPI, appointmentAPI } from "../../services/api";
import orderAPI from "../../services/orderApi";
import toast from "react-hot-toast";
import { 
  Calendar, 
  Pill, 
  Heart, 
  ClipboardList,
  TrendingUp,
  ShoppingBag,
  Lightbulb,
  CheckCircle
} from "lucide-react";


const DashboardHome = ({ user, setActiveSection }) => {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [upcomingCount, setUpcomingCount] = useState(null);
  const [activePrescriptions, setActivePrescriptions] = useState(null);
  const [totalOrders, setTotalOrders] = useState(null);

  useEffect(() => {
    fetchDashboardDoctors();
    fetchStats();

    // Listen for doctor status updates from WebSocket
    const handleDoctorStatusUpdate = (event) => {
      console.log('DashboardHome received doctor update:', event.detail);
      // Refresh doctors list when status changes
      fetchDashboardDoctors();
    };

    window.addEventListener('doctor_status_updated', handleDoctorStatusUpdate);

    return () => {
      window.removeEventListener('doctor_status_updated', handleDoctorStatusUpdate);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Upcoming Appointments
      const upcoming = await appointmentAPI.getUpcomingAppointments();
      setUpcomingCount(upcoming.count || 0);

      // Orders
      const orders = await orderAPI.getOrders();
      setTotalOrders(Array.isArray(orders.orders) ? orders.orders.length : 0);
      // Active Prescriptions: count orders with prescription_uploaded true
      const activePres = Array.isArray(orders.orders)
        ? orders.orders.filter(o => o.prescription_uploaded).length
        : 0;
      setActivePrescriptions(activePres);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard stats');
    }
  };

  const fetchDashboardDoctors = async () => {
    try {
      const response = await doctorAPI.getDashboardDoctors();
      setDoctors(response.doctors || []);
    } catch (error) {
      console.error("Error fetching dashboard doctors:", error);
      toast.error("Failed to load doctors");
    } finally {
      setLoadingDoctors(false);
    }
  };
  const quickActions = [
    {
      id: 1,
      title: "Book Appointment",
      description: "Schedule a visit with our doctors",
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      action: "appointments",
    },
    {
      id: 2,
      title: "Order Medications",
      description: "Get your prescriptions delivered",
      icon: Pill,
      color: "from-green-500 to-emerald-500",
      action: "medications",
    },
    {
      id: 3,
      title: "Mental Health Support",
      description: "We're here for you",
      icon: Heart,
      color: "from-pink-500 to-rose-500",
      action: "mental-health",
    },
    {
      id: 4,
      title: "My Appointments",
      description: "View your scheduled visits",
      icon: ClipboardList,
      color: "from-orange-500 to-amber-500",
      action: "my-appointments",
    },
  ];

  const healthTips = [
    "Stay hydrated - drink at least 8 glasses of water daily",
    "Get 7-9 hours of quality sleep each night",
    "Take short breaks every hour if working at a desk",
    "Practice deep breathing for stress relief",
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-2xl p-8 backdrop-blur-sm border border-white/10 shadow-xl">
        <h1 className="font-poppins font-bold text-4xl text-white mb-3">
          Welcome back, {user?.name || "User"}!
        </h1>
        <p className="text-gray-200 text-lg">
          How are you feeling today? Let us help you stay healthy.
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-poppins font-semibold text-2xl text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            // Debounce for quick actions
            const [lastClick, setLastClick] = useState(0);
            const DEBOUNCE_MS = 200;
            const handleQuickAction = () => {
              const now = Date.now();
              if (now - lastClick < DEBOUNCE_MS) return;
              setLastClick(now);
              setActiveSection(action.action);
            };
            return (
              <button
                key={action.id}
                onClick={handleQuickAction}
                className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-left hover:scale-105 hover:shadow-2xl"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="font-poppins font-semibold text-white text-lg mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/20 backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-200 text-sm font-medium mb-1">Upcoming Appointments</p>
              <p className="text-white font-bold text-4xl">{upcomingCount !== null ? upcomingCount : '--'}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center backdrop-blur-sm">
              <Calendar size={28} className="text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/20 backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-200 text-sm font-medium mb-1">Active Prescriptions</p>
              <p className="text-white font-bold text-4xl">{activePrescriptions !== null ? activePrescriptions : '--'}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center backdrop-blur-sm">
              <Pill size={28} className="text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-2xl p-6 border border-pink-500/20 backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-200 text-sm font-medium mb-1">Total Orders</p>
              <p className="text-white font-bold text-4xl">{totalOrders !== null ? totalOrders : '--'}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-pink-500/20 flex items-center justify-center backdrop-blur-sm">
              <ShoppingBag size={28} className="text-pink-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Available Doctors Preview */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-poppins font-semibold text-2xl text-white">
            Available Doctors
          </h2>
          <button
            onClick={() => setActiveSection("appointments")}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition"
          >
            View All
            <TrendingUp size={18} />
          </button>
        </div>
        
        {loadingDoctors ? (
          <div className="text-center text-gray-300 py-8">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="text-center text-gray-300 py-8">No doctors available at the moment</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all hover:scale-105 shadow-lg hover:shadow-2xl"
              >
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                  <img
                    src={doctor.img}
                    alt={doctor.name}
                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent"></div>
                  
                  {/* Available Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold shadow-lg">
                    ● Available
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-poppins font-semibold text-white text-lg mb-1">
                    {doctor.name}
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">{doctor.specialty}</p>
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <TrendingUp size={16} className="text-yellow-400" />
                    <span className="text-white font-medium">{doctor.rating || 4.8}</span>
                    <span className="text-gray-400">(120+ reviews)</span>
                  </div>
                  <button
                    onClick={() => setActiveSection("appointments")}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health Tips */}
      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl p-6 border border-green-500/20 backdrop-blur-sm shadow-lg">
        <h2 className="font-poppins font-semibold text-xl text-white mb-5 flex items-center gap-2">
          <Lightbulb size={24} className="text-yellow-400" />
          Daily Health Tips
        </h2>
        <ul className="space-y-3">
          {healthTips.map((tip, index) => (
            <li key={index} className="flex items-start gap-3 text-gray-200">
              <CheckCircle size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};

export default DashboardHome;
