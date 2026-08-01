import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { appointmentAPI } from "../../services/api";
import { doctor1, doctor2, doctor3, doctor4, doctor5, doctor6, doctor7, doctor8, doctor9, doctor10, doctor11, doctor12 } from "../../assets";
import { 
  Calendar, 
  Clock, 
  Video, 
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  FileText,
  Loader
} from "lucide-react";
import ApiEndpointsPanel from "./ApiEndpointsPanel";

const MyAppointments = () => {
  // Doctor image mapping
  const doctorImages = {
    "doctor-1": doctor3,
    "doctor-2": doctor2,
    "doctor-3": doctor1,
    "doctor-4": doctor4,
    "doctor-5": doctor5,
    "doctor-6": doctor6,
    "doctor-7": doctor7,
    "doctor-8": doctor8,
    "doctor-9": doctor9,
    "doctor-10": doctor10,
    "doctor-11": doctor11,
    "doctor-12": doctor12,
  };

  const [activeTab, setActiveTab] = useState("upcoming");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();

    // Listen for WebSocket appointment updates
    const handleAppointmentUpdate = (event) => {
      console.log('MyAppointments received update event:', event.detail);
      fetchAppointments(); // Refresh appointments list
    };

    window.addEventListener('appointment_updated', handleAppointmentUpdate);

    return () => {
      window.removeEventListener('appointment_updated', handleAppointmentUpdate);
    };
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await appointmentAPI.getMyAppointments();
      console.log("Appointments API response:", response);
      // Map doctor images to frontend imports
      const appointmentsWithImages = (response.appointments || []).map(apt => ({
        ...apt,
        doctor: {
          ...apt.doctor,
          img: doctorImages[apt.doctor.id] || apt.doctor.img
        }
      }));
      console.log("Appointments with images:", appointmentsWithImages);
      setAppointments(appointmentsWithImages);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === "confirmed" || apt.status === "pending"
  );

  const pastAppointments = appointments.filter(
    (apt) => apt.status === "completed" || apt.status === "cancelled"
  );

  const handleCancel = async (appointmentId) => {
    try {
      await appointmentAPI.cancelAppointment(appointmentId);
      toast.success('Appointment cancelled successfully');
      // Refresh appointments
      fetchAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { 
        icon: CheckCircle, 
        className: "bg-green-500/20 text-green-400 border-green-500/30",
        label: "Confirmed"
      },
      pending: { 
        icon: AlertCircle, 
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        label: "Pending"
      },
      completed: { 
        icon: CheckCircle, 
        className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        label: "Completed"
      },
      cancelled: { 
        icon: XCircle, 
        className: "bg-red-500/20 text-red-400 border-red-500/30",
        label: "Cancelled"
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border ${config.className}`}>
        <Icon size={16} />
        {config.label}
      </span>
    );
  };

  const AppointmentCard = ({ appointment, showActions = false }) => (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all shadow-lg hover:shadow-2xl">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Doctor Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20">
            <img
              src={appointment.doctor.img}
              alt={appointment.doctor.name}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <h3 className="font-poppins font-semibold text-white text-lg mb-1">
              {appointment.doctor.name}
            </h3>
            <p className="text-gray-300 text-sm mb-2">{appointment.doctor.specialty}</p>
            {getStatusBadge(appointment.status)}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="flex flex-col gap-2 md:text-right">
          <div className="flex items-center gap-2 text-white md:justify-end">
            <Calendar size={18} className="text-blue-400" />
            <span className="font-medium">{appointment.appointment_date || appointment.date}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 md:justify-end">
            <Clock size={18} className="text-blue-400" />
            <span>{appointment.appointment_time || appointment.time}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 md:justify-end">
            {(appointment.consultation_type || appointment.type) === "video-call" || (appointment.consultation_type || appointment.type) === "video" ? (
              <Video size={18} className="text-blue-400" />
            ) : (
              <Building2 size={18} className="text-blue-400" />
            )}
            <span>
              {(appointment.consultation_type || appointment.type) === "video-call" || (appointment.consultation_type || appointment.type) === "video"
                ? "Video Call"
                : "In-Person"}
            </span>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-start gap-2 text-gray-300">
          <FileText size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-white font-medium">Reason: </span>
            <span>{appointment.reason}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && appointment.status !== "cancelled" && (
        <div className="mt-4 flex flex-wrap gap-3">
          {((appointment.consultation_type || appointment.type) === "video-call" || (appointment.consultation_type || appointment.type) === "video") && appointment.status === "confirmed" && (
            <button className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium hover:shadow-lg transition">
              <Video size={18} />
              Join Video Call
            </button>
          )}
          <button className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition border border-white/10">
            <RotateCcw size={18} />
            Reschedule
          </button>
          <button
            onClick={() => handleCancel(appointment.id)}
            className="px-6 py-3 rounded-xl bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 transition border border-red-500/20 flex items-center gap-2"
          >
            <XCircle size={18} />
            Cancel
          </button>
        </div>
      )}

      {/* Completed Actions */}
      {appointment.status === "completed" && (
        <div className="mt-4 flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition border border-white/10">
            <FileText size={18} />
            View Summary
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition border border-white/10">
            <Calendar size={18} />
            Book Again
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 backdrop-blur-sm border border-blue-500/20 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <Calendar size={32} className="text-blue-400" />
          <h1 className="font-poppins font-bold text-4xl text-white">
            My Appointments
          </h1>
        </div>
        <p className="text-gray-200 text-lg">
          Manage your upcoming and past appointments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center shadow-lg">
          <p className="text-4xl font-bold text-white mb-1">{upcomingAppointments.length}</p>
          <p className="text-gray-300 text-sm">Upcoming</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center shadow-lg">
          <p className="text-4xl font-bold text-white mb-1">
            {appointments.filter((a) => a.status === "completed").length}
          </p>
          <p className="text-gray-300 text-sm">Completed</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center shadow-lg">
          <p className="text-4xl font-bold text-white mb-1">
            {appointments.filter((a) => a.status === "cancelled").length}
          </p>
          <p className="text-gray-300 text-sm">Cancelled</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center shadow-lg">
          <p className="text-4xl font-bold text-white mb-1">{appointments.length}</p>
          <p className="text-gray-300 text-sm">Total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-6 py-3 rounded-xl font-medium transition ${
            activeTab === "upcoming"
              ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
              : "bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10"
          }`}
        >
          Upcoming ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-6 py-3 rounded-xl font-medium transition ${
            activeTab === "past"
              ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
              : "bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10"
          }`}
        >
          Past ({pastAppointments.length})
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader size={48} className="text-blue-400 animate-spin" />
            <p className="text-gray-300 text-lg">Loading appointments...</p>
          </div>
        </div>
      )}

      {/* Appointments List */}
      {!loading && (
        <div className="space-y-4">
          {activeTab === "upcoming" ? (
            upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  showActions={true}
                />
              ))
            ) : (
              <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <Calendar size={64} className="text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-semibold text-xl mb-2">
                  No upcoming appointments
                </h3>
                <p className="text-gray-400 mb-6">
                Book an appointment with one of our doctors
              </p>
            </div>
          )
        ) : pastAppointments.length > 0 ? (
          pastAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              showActions={false}
            />
          ))
        ) : (
          <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <FileText size={64} className="text-gray-500 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-xl mb-2">
              No past appointments
            </h3>
            <p className="text-gray-400">
              Your completed appointments will appear here
            </p>
          </div>
        )}
      </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-2xl p-6 border border-blue-500/20 backdrop-blur-sm shadow-lg">
        <h3 className="font-poppins font-semibold text-xl text-white mb-3">
          Need to see a doctor?
        </h3>
        <p className="text-gray-200 mb-4">
          Book a new appointment or use our video consultation service for
          immediate assistance.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold hover:shadow-lg transition">
            <Calendar size={20} />
            Book New Appointment
          </button>
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition border border-white/20">
            <Video size={20} />
            Video Consultation
          </button>
        </div>
      </div>

      {/* API Endpoints Reference */}
      <ApiEndpointsPanel
        title="My Appointments — API Endpoints"
        endpoints={[
          { method: "GET",    path: "/api/appointments/my",          description: "List user appointments (filter by status)" },
          { method: "GET",    path: "/api/appointments/:id",         description: "Get a specific appointment" },
          { method: "PATCH",  path: "/api/appointments/:id",         description: "Update appointment status" },
          { method: "DELETE", path: "/api/appointments/:id",         description: "Cancel an appointment" },
        ]}
      />
    </div>
  );
};

export default MyAppointments;
