import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { doctorAPI, appointmentAPI } from "../../services/api";
import { doctor1, doctor2, doctor3, doctor4, doctor5, doctor6, doctor7, doctor8, doctor9, doctor10, doctor11, doctor12 } from "../../assets";
import { 
  Calendar, 
  Video, 
  Building2, 
  Search, 
  Star,
  CheckCircle,
  Clock,
  X,
  Award,
  MapPin,
  Phone,
  Mail,
  Users,
  ThumbsUp
} from "lucide-react";


const AppointmentBooking = () => {
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

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [consultationType, setConsultationType] = useState("in-person");
  const [reason, setReason] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDoctorDetail, setShowDoctorDetail] = useState(null);
  const [detailModalDate, setDetailModalDate] = useState("");
  const [detailModalTime, setDetailModalTime] = useState("");
  const [detailModalConsultationType, setDetailModalConsultationType] = useState("in-person");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingAppointment, setBookingAppointment] = useState(false);

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      // Fetch ALL doctors including inactive ones for appointment booking
      const response = await doctorAPI.getAllDoctorsIncludingInactive();
      // Map backend doctor images to frontend imports
      const doctorsWithImages = (response.doctors || []).map(doctor => ({
        ...doctor,
        img: doctorImages[doctor.id] || doctor.img
      }));
      setDoctors(doctorsWithImages);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const response = await appointmentAPI.getAvailableSlots(selectedDoctor.id, selectedDate);
      if (response.available) {
        setAvailableSlots(response.slots || []);
      } else {
        setAvailableSlots([]);
        toast.error(response.message || "No slots available");
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAvailableSlots([]);
      toast.error("Failed to load available slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const specialties = [
    "all",
    ...new Set(doctors.map((doc) => doc.specialty)),
  ];

  const timeSlots = loadingSlots 
    ? ["Loading..."] 
    : availableSlots.length > 0 
    ? availableSlots 
    : [
      "09:00 AM",
      "09:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "02:00 PM",
      "02:30 PM",
      "03:00 PM",
      "03:30 PM",
      "04:00 PM",
      "04:30 PM",
    ];

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSpecialty =
      selectedSpecialty === "all" || doctor.specialty === selectedSpecialty;
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !reason.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setBookingAppointment(true);
    try {
      const response = await appointmentAPI.createAppointment({
        doctor_id: selectedDoctor.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        reason: reason,
        consultation_type: consultationType
      });

      setShowConfirmation(true);
      toast.success('Appointment booked successfully!');
    } catch (error) {
      console.error("Error booking appointment:", error);
      const errorMessage = error.response?.data?.message || "Failed to book appointment";
      toast.error(errorMessage);
    } finally {
      setBookingAppointment(false);
    }
  };

  const resetForm = () => {
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedTime("");
    setReason("");
    setShowConfirmation(false);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl p-8 backdrop-blur-sm border border-blue-500/20 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <Calendar size={32} className="text-blue-400" />
          <h1 className="font-poppins font-bold text-4xl text-white">
            Book an Appointment
          </h1>
        </div>
        <p className="text-gray-200 text-lg">
          Choose from our expert doctors and schedule your visit
        </p>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-purple-800/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={48} className="text-green-400" />
              </div>
              <h2 className="font-poppins font-bold text-2xl text-white mb-2">
                Appointment Booked!
              </h2>
              <p className="text-gray-300 mb-6">
                Your appointment has been successfully scheduled.
              </p>
              <div className="bg-purple-700/50 rounded-xl p-5 text-left mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden">
                    <img
                      src={selectedDoctor?.img}
                      alt={selectedDoctor?.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {selectedDoctor?.name}
                    </p>
                    <p className="text-gray-300 text-sm">
                      {selectedDoctor?.specialty}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar size={18} className="text-blue-400" />
                    <span className="text-white">{selectedDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock size={18} className="text-blue-400" />
                    <span className="text-white">{selectedTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    {consultationType === "in-person" ? (
                      <Building2 size={18} className="text-blue-400" />
                    ) : (
                      <Video size={18} className="text-blue-400" />
                    )}
                    <span className="text-white">
                      {consultationType === "in-person"
                        ? "In-Person Visit"
                        : "Video Consultation"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold hover:shadow-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-white font-medium mb-2">
              Search Doctor
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-purple-700/30 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Specialty Filter */}
          <div>
            <label className="block text-white font-medium mb-2">
              Specialty
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-purple-700/30 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
            >
              {specialties.map((specialty) => (
                <option
                  key={specialty}
                  value={specialty}
                  className="bg-purple-800"
                >
                  {specialty === "all" ? "All Specialties" : specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Consultation Type */}
          <div>
            <label className="block text-white font-medium mb-2">
              Consultation Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setConsultationType("in-person")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                  consultationType === "in-person"
                    ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                    : "bg-purple-700/30 text-gray-300 hover:text-white hover:bg-purple-700/50"
                }`}
              >
                <Building2 size={18} />
                In-Person
              </button>
              <button
                onClick={() => setConsultationType("video")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                  consultationType === "video"
                    ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                    : "bg-purple-700/30 text-gray-300 hover:text-white hover:bg-purple-700/50"
                }`}
              >
                <Video size={18} />
                Video
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div>
        <h2 className="font-poppins font-semibold text-2xl text-white mb-6">
          Select a Doctor ({loading ? "..." : filteredDoctors.length} available)
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-300 text-lg">Loading doctors...</p>
            </div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <p className="text-gray-300 text-lg">No doctors found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className={`group rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl ${
                selectedDoctor?.id === doctor.id
                  ? "bg-gradient-to-br from-blue-600/30 to-green-600/30 border-green-500"
                  : "bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20"
              }`}
            >
              <div className="relative h-64 overflow-hidden bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                <img
                  src={doctor.img}
                  alt={doctor.name}
                  className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                  onClick={() => setShowDoctorDetail(doctor)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/40 to-transparent"></div>
                
                {/* Availability Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${
                  doctor.is_active 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {doctor.is_active ? '● Available' : '● Offline'}
                </div>

                {selectedDoctor?.id === doctor.id && (
                  <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                    <CheckCircle size={24} className="text-white" />
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDoctorDetail(doctor);
                  }}
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-blue-500/90 hover:bg-blue-500 rounded-lg text-white text-sm font-medium transition"
                >
                  View Profile
                </button>
              </div>
              <div className="p-5 cursor-pointer" onClick={() => setSelectedDoctor(doctor)}>
                <h3 className="font-poppins font-semibold text-white text-lg mb-1">
                  {doctor.name}
                </h3>
                <p className="text-gray-300 text-sm mb-3">{doctor.specialty}</p>
                <div className="flex items-center gap-2 text-sm mb-3">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-medium">{doctor.rating || 4.8}</span>
                  <span className="text-gray-400">(120+ reviews)</span>
                </div>
                <p className="text-green-400 font-semibold text-lg">₹{doctor.consultation_fee || 4200} / visit</p>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Doctor Detail Modal */}
      {showDoctorDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-purple-800/95 backdrop-blur-md rounded-2xl max-w-3xl w-full border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <button
                onClick={() => setShowDoctorDetail(null)}
                className="float-right text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="w-40 h-40 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                  <img
                    src={showDoctorDetail.img}
                    alt={showDoctorDetail.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="font-poppins font-bold text-3xl text-white mb-2">
                    {showDoctorDetail.name}
                  </h2>
                  <p className="text-blue-400 text-lg mb-3">{showDoctorDetail.specialty}</p>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Star size={18} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-medium">4.8</span>
                      <span className="text-gray-400">(120+ reviews)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users size={18} className="text-blue-400" />
                      <span>500+ Patients</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={18} className="text-green-400" />
                    <span className="text-gray-300">Board Certified • 12 years experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-blue-400" />
                    <span className="text-gray-300">Health Medical Center, Building A</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-white text-lg mb-3 flex items-center gap-2">
                    <Award size={20} className="text-blue-400" />
                    About
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {showDoctorDetail.specialty === "Cardiologist" && "With over 12 years of specialized experience in cardiology, dedicated to providing comprehensive heart care including diagnosis, treatment, and prevention of cardiovascular diseases. Expert in performing advanced cardiac procedures and managing complex heart conditions."}
                    {showDoctorDetail.specialty === "Neurologist" && "Specializes in diagnosing and treating disorders of the nervous system including the brain, spinal cord, and nerves. Over a decade of experience in managing conditions like epilepsy, stroke, Alzheimer's, and Parkinson's disease."}
                    {showDoctorDetail.specialty === "Dermatologist" && "Expert in treating skin, hair, and nail conditions. Specializes in both medical dermatology and cosmetic procedures. Committed to providing personalized care for patients of all ages with various skin concerns."}
                    {showDoctorDetail.specialty === "Pediatrician" && "Dedicated to the health and well-being of children from infancy through adolescence. Experienced in preventive care, developmental screenings, and treating common childhood illnesses. Passionate about building long-term relationships with families."}
                    {showDoctorDetail.specialty === "Psychiatrist" && "Specializes in mental health care with a focus on diagnosis and treatment of emotional and behavioral disorders. Experienced in therapy, medication management, and holistic approaches to mental wellness."}
                    {!["Cardiologist", "Neurologist", "Dermatologist", "Pediatrician", "Psychiatrist"].includes(showDoctorDetail.specialty) && "Highly experienced medical professional dedicated to providing exceptional patient care. Committed to staying current with the latest medical advancements and treatment protocols to ensure the best outcomes for patients."}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white text-lg mb-3">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {showDoctorDetail.specialty === "Cardiologist" && ["Heart Disease", "Hypertension", "Arrhythmia", "Heart Failure", "Preventive Cardiology"].map((spec, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm border border-blue-500/30">
                        {spec}
                      </span>
                    ))}
                    {showDoctorDetail.specialty === "Neurologist" && ["Epilepsy", "Stroke Care", "Multiple Sclerosis", "Headache & Migraine", "Parkinson's Disease"].map((spec, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm border border-blue-500/30">
                        {spec}
                      </span>
                    ))}
                    {showDoctorDetail.specialty === "Dermatologist" && ["Acne Treatment", "Skin Cancer", "Psoriasis", "Eczema", "Cosmetic Dermatology"].map((spec, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm border border-blue-500/30">
                        {spec}
                      </span>
                    ))}
                    {showDoctorDetail.specialty === "Pediatrician" && ["Well-Child Visits", "Immunizations", "Growth & Development", "Childhood Illnesses", "Adolescent Care"].map((spec, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm border border-blue-500/30">
                        {spec}
                      </span>
                    ))}
                    {!["Cardiologist", "Neurologist", "Dermatologist", "Pediatrician"].includes(showDoctorDetail.specialty) && ["General Practice", "Preventive Care", "Diagnosis", "Treatment Planning", "Patient Education"].map((spec, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm border border-blue-500/30">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white text-lg mb-3">Education & Credentials</h3>
                  <div className="space-y-2 text-gray-300">
                    <p className="flex items-center gap-2">
                      <Award size={16} className="text-green-400" />
                      Medical Degree (MD) - Johns Hopkins University
                    </p>
                    <p className="flex items-center gap-2">
                      <Award size={16} className="text-green-400" />
                      Residency - {showDoctorDetail.specialty} - Mayo Clinic
                    </p>
                    <p className="flex items-center gap-2">
                      <Award size={16} className="text-green-400" />
                      Board Certified in {showDoctorDetail.specialty}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white text-lg mb-3">Patient Reviews</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Sarah M.", rating: 5, comment: "Excellent doctor! Very thorough and caring. Took time to explain everything." },
                      { name: "John D.", rating: 5, comment: "Highly recommended. Professional and knowledgeable. Made me feel at ease." },
                      { name: "Emma R.", rating: 4, comment: "Great experience. Wait time was reasonable and staff was friendly." },
                    ].map((review, idx) => (
                      <div key={idx} className="p-4 bg-purple-700/30 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{review.name}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-400" />
                    Availability & Pricing
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-300 mb-1">Consultation Fee:</p>
                      <p className="text-green-400 font-bold text-lg">₹{showDoctorDetail.consultation_fee || 4200}</p>
                    </div>
                    <div>
                      <p className="text-gray-300 mb-1">Availability:</p>
                      <p className="text-white font-medium">Mon - Sat: 9AM - 5PM</p>
                    </div>
                  </div>
                </div>

                {/* Booking Form in Detail Modal */}
                <div className="bg-purple-700/20 border border-purple-500/30 rounded-xl p-6">
                  <h3 className="font-semibold text-white text-lg mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-purple-400" />
                    Book Appointment
                  </h3>

                  <div className="space-y-4">
                    {/* Consultation Type */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Consultation Type
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDetailModalConsultationType("in-person")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition ${
                            detailModalConsultationType === "in-person"
                              ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                              : "bg-purple-700/30 text-gray-300 hover:text-white hover:bg-purple-700/50"
                          }`}
                        >
                          <Building2 size={16} />
                          In-Person
                        </button>
                        <button
                          onClick={() => setDetailModalConsultationType("video")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition ${
                            detailModalConsultationType === "video"
                              ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                              : "bg-purple-700/30 text-gray-300 hover:text-white hover:bg-purple-700/50"
                          }`}
                        >
                          <Video size={16} />
                          Video
                        </button>
                      </div>
                    </div>

                    {/* Date Selection */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Select Date
                      </label>
                      <input
                        type="date"
                        min={today}
                        value={detailModalDate}
                        onChange={(e) => setDetailModalDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-purple-700/30 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>

                    {/* Time Selection */}
                    {detailModalDate && (
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Select Time Slot
                        </label>
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {timeSlots.map((time) => (
                            <button
                              key={time}
                              onClick={() => setDetailModalTime(time)}
                              className={`py-2.5 px-2 rounded-xl font-medium text-sm transition ${
                                detailModalTime === time
                                  ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg scale-105"
                                  : "bg-purple-700/30 text-gray-300 hover:text-white hover:bg-purple-600/50 border border-white/10"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reason for Appointment */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Reason for Appointment *
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please describe your symptoms or reason for consultation..."
                        className="w-full px-4 py-3 rounded-xl bg-purple-700/30 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition resize-none"
                        rows="3"
                      />
                    </div>

                    {/* Book Button */}
                    <button 
                      onClick={async () => {
                        if (!detailModalDate || !detailModalTime) {
                          toast.error('Please select date and time');
                          return;
                        }
                        if (!reason || !reason.trim()) {
                          toast.error('Please provide a reason for the appointment');
                          return;
                        }
                        
                        setBookingAppointment(true);
                        try {
                          await appointmentAPI.createAppointment({
                            doctor_id: showDoctorDetail.id,
                            appointment_date: detailModalDate,
                            appointment_time: detailModalTime,
                            reason: reason,
                            consultation_type: detailModalConsultationType
                          });
                          
                          setSelectedDoctor(showDoctorDetail);
                          setSelectedDate(detailModalDate);
                          setSelectedTime(detailModalTime);
                          setConsultationType(detailModalConsultationType);
                          setShowDoctorDetail(null);
                          setShowConfirmation(true);
                          toast.success('Appointment booked successfully!');
                          
                          // Reset states
                          setDetailModalDate("");
                          setDetailModalTime("");
                          setDetailModalConsultationType("in-person");
                        } catch (error) {
                          console.error("Error booking appointment:", error);
                          const errorMessage = error.response?.data?.message || "Failed to book appointment";
                          toast.error(errorMessage);
                        } finally {
                          setBookingAppointment(false);
                        }
                      }}
                      disabled={!detailModalDate || !detailModalTime || bookingAppointment}
                      className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                        detailModalDate && detailModalTime && !bookingAppointment
                          ? "bg-gradient-to-r from-blue-500 to-green-500 text-white hover:shadow-lg"
                          : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <CheckCircle size={20} />
                      Confirm Appointment
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => {
                      setShowDoctorDetail(null);
                      setDetailModalDate("");
                      setDetailModalTime("");
                      setDetailModalConsultationType("in-person");
                    }}
                    className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition border border-white/20"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AppointmentBooking;
