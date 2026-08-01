import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { authAPI } from "../../services/api";
import { profileAPI } from '../../services/profileApi';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Shield,
  FileText,
  Settings,
  Camera,
  Edit,
  Save,
  Heart,
  Activity,
  AlertCircle
} from "lucide-react";


const ProfileSection = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);
  
  // Get user from localStorage if not passed as prop
  const currentUser = user || authAPI.getCurrentUser();
  
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || "User",
    email: currentUser?.email || "user@example.com",
    phone: "+1 (555) 123-4567",
    dateOfBirth: "1990-05-15",
    gender: "Male",
    address: "123 Health Street, Medical City, MC 12345",
    emergencyContact: "+1 (555) 987-6543",
    emergencyName: "Emergency Contact",
    bloodType: "O+",
    height: "175 cm",
    weight: "70 kg",
    allergies: "None",
    chronicConditions: "None",
    currentMedications: "None",
    lastCheckup: "2025-12-15"
  });

  // Update profile data when user prop changes
  useEffect(() => {
    if (currentUser) {
      setProfileData(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email
      }));
    }
  }, [currentUser]);

  // Fetch profile data from backend
  useEffect(() => {
    fetchProfileData(activeTab);
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchProfileData = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'personal') {
        const data = await profileAPI.getPersonalInfo();
        setProfileData({
          name: data.personal_info.full_name || '',
          email: data.personal_info.email || '',
          phone: data.personal_info.phone || '',
          dateOfBirth: data.personal_info.dob ? data.personal_info.dob.substring(0,10) : '',
          gender: data.personal_info.gender || '',
          address: data.personal_info.address || '',
          emergencyContact: data.personal_info.emergency_contact?.phone || '',
          emergencyName: data.personal_info.emergency_contact?.name || ''
        });
      } else if (tab === 'medical') {
        const data = await profileAPI.getMedicalHistory();
        setProfileData(prev => ({
          ...prev,
          bloodType: data.medical_history.blood_type || '',
          height: data.medical_history.height || '',
          weight: data.medical_history.weight || '',
          lastCheckup: data.medical_history.last_checkup ? data.medical_history.last_checkup.substring(0,10) : '',
          allergies: (data.medical_history.allergies || []).join(', '),
          chronicConditions: (data.medical_history.chronic_conditions || []).join(', '),
          currentMedications: (data.medical_history.medications || []).join(', ')
        }));
      } else if (tab === 'security') {
        const data = await profileAPI.getSecuritySettings();
        setProfileData(prev => ({
          ...prev,
          twoFactorEnabled: data.security_settings.two_factor_enabled || false
        }));
      }
    } catch (err) {
      toast.error('Failed to fetch profile data');
    }
    setLoading(false);
  };

  // Save changes to backend
  const handleSave = async () => {
    setIsEditing(false);
    setLoading(true);
    try {
      if (activeTab === 'personal') {
        await profileAPI.updatePersonalInfo({
          full_name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          dob: profileData.dateOfBirth,
          gender: profileData.gender,
          address: profileData.address,
          emergency_contact: {
            name: profileData.emergencyName,
            phone: profileData.emergencyContact
          }
        });
      } else if (activeTab === 'medical') {
        await profileAPI.updateMedicalHistory({
          blood_type: profileData.bloodType,
          height: profileData.height,
          weight: profileData.weight,
          last_checkup: profileData.lastCheckup,
          allergies: profileData.allergies.split(',').map(s => s.trim()),
          chronic_conditions: profileData.chronicConditions.split(',').map(s => s.trim()),
          medications: profileData.currentMedications.split(',').map(s => s.trim())
        });
      } else if (activeTab === 'security') {
        await profileAPI.updateSecuritySettings({
          two_factor_enabled: profileData.twoFactorEnabled
        });
      }
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-8 backdrop-blur-sm border border-purple-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
              {profileData.name.split(' ').map(n => n[0]).join('')}
            </div>
            <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition shadow-lg">
              <Camera size={18} />
            </button>
          </div>
          
          <div className="flex-1">
            <h1 className="font-poppins font-bold text-4xl text-white mb-2">
              {profileData.name}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-gray-300">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-blue-400" />
                <span>{profileData.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-blue-400" />
                <span>{profileData.phone}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white font-semibold hover:shadow-lg transition flex items-center gap-2"
          >
            {isEditing ? (
              <>
                <Save size={20} />
                Save Changes
              </>
            ) : (
              <>
                <Edit size={20} />
                Edit Profile
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "personal", label: "Personal Info", icon: User },
          { id: "medical", label: "Medical History", icon: Heart },
          { id: "security", label: "Security", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                  : "bg-white/5 text-gray-300 hover:text-white border border-white/10"
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Personal Info Tab */}
      {activeTab === "personal" && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-lg">
          <h2 className="font-poppins font-semibold text-2xl text-white mb-6 flex items-center gap-2">
            <User size={24} className="text-blue-400" />
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <User size={18} />
                Full Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition ${
                  !isEditing && "opacity-60 cursor-not-allowed"
                }`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <Mail size={18} />
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition ${
                  !isEditing && "opacity-60 cursor-not-allowed"
                }`}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <Phone size={18} />
                Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition ${
                  !isEditing && "opacity-60 cursor-not-allowed"
                }`}
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <Calendar size={18} />
                Date of Birth
              </label>
              <input
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition ${
                  !isEditing && "opacity-60 cursor-not-allowed"
                }`}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <User size={18} />
                Gender
              </label>
              <select
                value={profileData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition ${
                  !isEditing && "opacity-60 cursor-not-allowed"
                }`}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <MapPin size={18} />
                Address
              </label>
              <input
                type="text"
                value={profileData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition ${
                  !isEditing && "opacity-60 cursor-not-allowed"
                }`}
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="font-semibold text-xl text-white mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-400" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-gray-300 mb-2">
                  <User size={18} />
                  Contact Name
                </label>
                <input
                  type="text"
                  value={profileData.emergencyName}
                  onChange={(e) => handleInputChange("emergencyName", e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition ${
                    !isEditing && "opacity-60 cursor-not-allowed"
                  }`}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-gray-300 mb-2">
                  <Phone size={18} />
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={profileData.emergencyContact}
                  onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition ${
                    !isEditing && "opacity-60 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical History Tab */}
      {activeTab === "medical" && (
        <div className="space-y-6">
          {/* Vital Statistics */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-lg">
            <h2 className="font-poppins font-semibold text-2xl text-white mb-6 flex items-center gap-2">
              <Activity size={24} className="text-blue-400" />
              Vital Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="text-gray-300 mb-2 block">Blood Type</label>
                <input
                  type="text"
                  value={profileData.bloodType}
                  onChange={(e) => handleInputChange("bloodType", e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition ${
                    !isEditing && "opacity-60 cursor-not-allowed"
                  }`}
                />
              </div>
              <div>
                <label className="text-gray-300 mb-2 block">Height</label>
                <input
                  type="text"
                  value={profileData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition ${
                    !isEditing && "opacity-60 cursor-not-allowed"
                  }`}
                />
              </div>
              <div>
                <label className="text-gray-300 mb-2 block">Weight</label>
                <input
                  type="text"
                  value={profileData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition ${
                    !isEditing && "opacity-60 cursor-not-allowed"
                  }`}
                />
              </div>
              <div>
                <label className="text-gray-300 mb-2 block">Last Checkup</label>
                <input
                  type="date"
                  value={profileData.lastCheckup}
                  onChange={(e) => handleInputChange("lastCheckup", e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition ${
                    !isEditing && "opacity-60 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-lg">
            <h2 className="font-poppins font-semibold text-2xl text-white mb-6 flex items-center gap-2">
              <FileText size={24} className="text-blue-400" />
              Medical Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-gray-300 mb-2">
                  <AlertCircle size={18} className="text-red-400" />
                  Allergies
                </label>
                <textarea
                  value={profileData.allergies}
                  onChange={(e) => handleInputChange("allergies", e.target.value)}
                  disabled={!isEditing}
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition resize-none ${
                    !isEditing && "opacity-60 cursor-not-allowed"
                  }`}
                  placeholder="List any allergies (medications, food, etc.)"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-300 mb-2">
                  <Heart size={18} className="text-red-400" />
                  Chronic Conditions
                </label>
                <textarea
                  value={profileData.chronicConditions}
                  onChange={(e) => handleInputChange("chronicConditions", e.target.value)}
                  disabled={!isEditing}
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition resize-none ${
                    !isEditing && "opacity-60 cursor-not-allowed"
                  }`}
                  placeholder="List any chronic health conditions"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-300 mb-2">
                  <FileText size={18} className="text-blue-400" />
                  Current Medications
                </label>
                <textarea
                  value={profileData.currentMedications}
                  onChange={(e) => handleInputChange("currentMedications", e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white focus:outline-none focus:border-blue-500 transition resize-none ${
                    !isEditing && "opacity-60 cursor-not-allowed"
                  }`}
                  placeholder="List all current medications with dosage"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-lg">
          <h2 className="font-poppins font-semibold text-2xl text-white mb-6 flex items-center gap-2">
            <Shield size={24} className="text-blue-400" />
            Security Settings
          </h2>

          <div className="space-y-6">
            {/* Change Password */}
            <div>
              <h3 className="text-white font-semibold mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 mb-2 block">Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-gray-300 mb-2 block">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-gray-300 mb-2 block">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <button 
                  onClick={() => toast.success('Password updated successfully')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white font-semibold hover:shadow-lg transition"
                >
                  Update Password
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-white font-semibold mb-4">Two-Factor Authentication</h3>
              <div className="flex items-center justify-between p-4 bg-purple-700/30 rounded-xl border border-white/10">
                <div>
                  <p className="text-white font-medium">Enable 2FA</p>
                  <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                </div>
                <button 
                  onClick={() => toast.success('2FA enabled successfully')}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition"
                >
                  Enable
                </button>
              </div>
            </div>

            {/* Account Actions */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-white font-semibold mb-4">Account Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => toast.success('Account data exported')}
                  className="w-full py-3 rounded-xl bg-purple-700/30 text-white font-medium hover:bg-purple-700/50 transition border border-white/10 flex items-center justify-center gap-2"
                >
                  <FileText size={18} />
                  Download My Data
                </button>
                <button className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition border border-red-500/30 flex items-center justify-center gap-2">
                  <AlertCircle size={18} />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileSection;
