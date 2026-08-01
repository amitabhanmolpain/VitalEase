import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { 
  Pill, 
  ShoppingCart, 
  Search, 
  Filter,
  Package,
  Heart,
  Star,
  Trash,
  Plus,
  Minus,
  Upload,
  Check,
  Clock,
  Truck,
  CreditCard,
  X,
  ArrowLeft,
  MapPin,
  Home,
  User,
  Phone,
  CheckCircle,
  Edit,
  ClipboardList,
  History,
  Loader2
} from "lucide-react";
import { cartAPI } from "../../services/cartApi";
import { orderAPI } from "../../services/orderApi";
import { addressAPI } from "../../services/addressApi";


const MedicationSection = () => {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentView, setCurrentView] = useState("medications"); // medications, cart, address, orderConfirmation
  const [showPrescriptionUpload, setShowPrescriptionUpload] = useState(false);
  const [cartTab, setCartTab] = useState("cart"); // cart, orders, addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [previousOrders, setPreviousOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    addressType: "home"
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchCart();
    fetchOrders();
    fetchAddresses();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.getCart();
      if (response.success && response.cart) {
        // Transform backend cart items to match frontend format
        const cartItems = response.cart.items.map(item => ({
          id: item.medicine_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          description: item.description,
          requiresPrescription: item.requires_prescription
        }));
        setCart(cartItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getOrders();
      if (response.success && response.orders) {
        // Transform backend orders to match frontend format
        const orders = response.orders.map(order => ({
          id: order.order_id,
          date: order.created_at,
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total: order.total,
          status: order.status,
          deliveryAddress: order.delivery_address 
            ? `${order.delivery_address.address_line1}, ${order.delivery_address.city} - ${order.delivery_address.pincode}`
            : ''
        }));
        setPreviousOrders(orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await addressAPI.getAddresses();
      if (response.success && response.addresses) {
        // Transform backend addresses to match frontend format
        const addresses = response.addresses.map(addr => ({
          id: addr.id,
          fullName: addr.full_name,
          phone: addr.phone,
          addressLine1: addr.address_line1,
          addressLine2: addr.address_line2,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          addressType: addr.address_type,
          isDefault: addr.is_default
        }));
        setSavedAddresses(addresses);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const categories = [
    { id: "all", label: "All", icon: Package },
    { id: "pain-relief", label: "Pain Relief", icon: Pill },
    { id: "vitamins", label: "Vitamins", icon: Heart },
    { id: "antibiotics", label: "Antibiotics", icon: Pill },
    { id: "cold-flu", label: "Cold & Flu", icon: Package },
  ];

  const medications = [
    {
      id: 1,
      name: "Paracetamol 500mg",
      category: "pain-relief",
      price: 749,
      description: "For fever and pain relief",
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
      requiresPrescription: false,
      inStock: true,
      rating: 4.5,
      reviews: 234
    },
    {
      id: 2,
      name: "Ibuprofen 400mg",
      category: "pain-relief",
      price: 1099,
      description: "Anti-inflammatory and pain reliever",
      image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop",
      requiresPrescription: false,
      inStock: true,
      rating: 4.7,
      reviews: 189
    },
    {
      id: 3,
      name: "Amoxicillin 500mg",
      category: "antibiotics",
      price: 1349,
      description: "Antibiotic for bacterial infections",
      image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop",
      requiresPrescription: true,
      inStock: true,
      rating: 4.6,
      reviews: 156
    },
    {
      id: 4,
      name: "Vitamin D3 1000 IU",
      category: "vitamins",
      price: 1599,
      description: "Bone health and immunity support",
      image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&h=300&fit=crop",
      requiresPrescription: false,
      inStock: true,
      rating: 4.8,
      reviews: 412
    },
    {
      id: 5,
      name: "Multivitamin Complex",
      category: "vitamins",
      price: 2099,
      description: "Complete daily vitamin supplement",
      image: "https://images.unsplash.com/photo-1526434426615-1abe81efcb0b?w=400&h=300&fit=crop",
      requiresPrescription: false,
      inStock: true,
      rating: 4.5,
      reviews: 328
    },
    {
      id: 6,
      name: "Cold Relief Syrup",
      category: "cold-flu",
      price: 1249,
      description: "Relief from cold and flu symptoms",
      image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=300&fit=crop",
      requiresPrescription: false,
      inStock: true,
      rating: 4.4,
      reviews: 267
    },
    {
      id: 7,
      name: "Antihistamine Tablets",
      category: "pain-relief",
      price: 999,
      description: "For allergy relief",
      image: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&h=300&fit=crop",
      requiresPrescription: false,
      inStock: true,
      rating: 4.6,
      reviews: 198
    },
    {
      id: 8,
      name: "Cough Suppressant",
      category: "cold-flu",
      price: 1149,
      description: "Effective cough relief",
      image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop",
      requiresPrescription: false,
      inStock: false,
      rating: 4.3,
      reviews: 145
    },
    {
      id: 9,
      name: "Omega-3 Fish Oil",
      category: "vitamins",
      price: 2499,
      description: "Heart and brain health support",
      image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=300&fit=crop",
      requiresPrescription: false,
      inStock: true,
      rating: 4.7,
      reviews: 389
    },
    {
      id: 10,
      name: "Azithromycin 500mg",
      category: "antibiotics",
      price: 1949,
      description: "Broad-spectrum antibiotic",
      image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop",
      requiresPrescription: true,
      inStock: true,
      rating: 4.5,
      reviews: 142
    },
    {
      id: 11,
      name: "Vitamin C 1000mg",
      category: "vitamins",
      price: 1399,
      description: "Immune system support",
      image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&h=300&fit=crop",
      requiresPrescription: false,
      inStock: true,
      rating: 4.6,
      reviews: 456
    },
    {
      id: 12,
      name: "Pain Relief Gel",
      category: "pain-relief",
      price: 1699,
      description: "Topical pain relief",
      image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&h=300&fit=crop",
      requiresPrescription: false,
      inStock: true,
      rating: 4.4,
      reviews: 223
    },
  ];

  const filteredMedications = medications.filter((med) => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          med.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || med.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = async (medication) => {
    try {
      const existingItem = cart.find(item => item.id === medication.id);
      
      if (existingItem) {
        // Update quantity in backend
        const newQuantity = existingItem.quantity + 1;
        await cartAPI.updateCartItem(medication.id.toString(), newQuantity);
        setCart(cart.map(item =>
          item.id === medication.id
            ? { ...item, quantity: newQuantity }
            : item
        ));
        toast.success(`Increased ${medication.name} quantity`);
      } else {
        // Add new item to backend
        await cartAPI.addToCart(medication);
        setCart([...cart, { ...medication, quantity: 1 }]);
        toast.success(`${medication.name} added to cart`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Fallback to local state if API fails
      const existingItem = cart.find(item => item.id === medication.id);
      if (existingItem) {
        setCart(cart.map(item =>
          item.id === medication.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setCart([...cart, { ...medication, quantity: 1 }]);
      }
      toast.success(`${medication.name} added to cart`);
    }
  };

  const removeFromCart = async (medicationId) => {
    const item = cart.find(item => item.id === medicationId);
    try {
      await cartAPI.removeFromCart(medicationId.toString());
      setCart(cart.filter(item => item.id !== medicationId));
      toast.success(`${item?.name || 'Item'} removed from cart`);
    } catch (error) {
      console.error('Error removing from cart:', error);
      // Fallback to local state
      setCart(cart.filter(item => item.id !== medicationId));
      toast.success(`${item?.name || 'Item'} removed from cart`);
    }
  };

  const updateQuantity = async (medicationId, delta) => {
    const item = cart.find(item => item.id === medicationId);
    if (!item) return;
    
    const newQuantity = Math.max(1, item.quantity + delta);
    
    try {
      await cartAPI.updateCartItem(medicationId.toString(), newQuantity);
      setCart(cart.map(item => {
        if (item.id === medicationId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Fallback to local state
      setCart(cart.map(item => {
        if (item.id === medicationId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      }));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setCurrentView("address");
  };

  const handleContinueToOrder = () => {
    if (!validateAddress()) {
      return;
    }
    setCurrentView("orderConfirmation");
  };

  const validateAddress = () => {
    if (!deliveryAddress.fullName || !deliveryAddress.phone || 
        !deliveryAddress.addressLine1 || !deliveryAddress.city || 
        !deliveryAddress.state || !deliveryAddress.pincode) {
      toast.error('Please fill all required fields');
      return false;
    }
    
    if (deliveryAddress.pincode.length !== 6) {
      toast.error('Please enter valid 6-digit pincode');
      return false;
    }
    
    if (deliveryAddress.phone.length !== 10) {
      toast.error('Please enter valid 10-digit phone number');
      return false;
    }
    
    return true;
  };

  const handleFinalCheckout = () => {
    if (!validateAddress()) {
      return;
    }

    const hasPrescriptionItems = cart.some(item => item.requiresPrescription);
    
    if (hasPrescriptionItems) {
      setShowPrescriptionUpload(true);
    } else {
      completeOrder();
    }
  };

  const completeOrder = async (prescriptionUploaded = false, prescriptionUrl = null) => {
    setLoading(true);
    try {
      const orderData = {
        items: cart,
        deliveryAddress: deliveryAddress,
        paymentMethod: 'COD',
        prescriptionUploaded,
        prescriptionUrl
      };
      
      const response = await orderAPI.createOrder(orderData);
      
      if (response.success) {
        toast.success('Order placed successfully! Expected delivery in 2-3 days');
        setCart([]);
        setCurrentView("medications");
        setDeliveryAddress({
          fullName: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          pincode: "",
          addressType: "home"
        });
        setShowPrescriptionUpload(false);
        // Refresh orders list
        fetchOrders();
      } else {
        toast.error(response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrescriptionUpload = () => {
    toast.success('Prescription uploaded! Proceeding with order');
    setTimeout(() => {
      completeOrder(true, 'prescription_uploaded');
    }, 1000);
  };

  // Address management functions
  const handleSaveAddress = async (addressData, isEdit = false, addressId = null) => {
    setLoading(true);
    try {
      let response;
      if (isEdit && addressId) {
        response = await addressAPI.updateAddress(addressId, addressData);
      } else {
        response = await addressAPI.createAddress(addressData);
      }
      
      if (response.success) {
        toast.success(isEdit ? 'Address updated!' : 'Address saved!');
        fetchAddresses();
        return true;
      } else {
        toast.error(response.message || 'Failed to save address');
        return false;
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const response = await addressAPI.deleteAddress(addressId);
      if (response.success) {
        toast.success('Address deleted');
        fetchAddresses();
      } else {
        toast.error(response.message || 'Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const response = await addressAPI.setDefaultAddress(addressId);
      if (response.success) {
        toast.success('Default address updated');
        fetchAddresses();
      } else {
        toast.error(response.message || 'Failed to update default address');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
    }
  };

  const handleReorder = async (orderId) => {
    try {
      const response = await orderAPI.reorder(orderId);
      if (response.success) {
        toast.success('Items added to cart!');
        fetchCart();
        setCartTab("cart");
      } else {
        toast.error(response.message || 'Failed to reorder');
      }
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to add items to cart');
    }
  };

  // Cart View with Tabs
  if (currentView === "cart") {
    return (
      <div className="space-y-6">
        {/* Cart Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-2xl p-8 backdrop-blur-sm border border-blue-500/20 shadow-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView("medications")}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart size={32} className="text-blue-400" />
                <h1 className="font-poppins font-bold text-4xl text-white">
                  Shopping Cart
                </h1>
              </div>
              <p className="text-gray-200 text-lg">
                {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10 shadow-lg">
          <div className="flex gap-2">
            <button
              onClick={() => setCartTab("cart")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition ${
                cartTab === "cart"
                  ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <ShoppingCart size={20} />
              Cart ({cart.length})
            </button>
            <button
              onClick={() => setCartTab("orders")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition ${
                cartTab === "orders"
                  ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <History size={20} />
              Previous Orders
            </button>
            <button
              onClick={() => setCartTab("addresses")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition ${
                cartTab === "addresses"
                  ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <MapPin size={20} />
              Saved Addresses
            </button>
          </div>
        </div>

        {/* Cart Tab Content */}
        {cartTab === "cart" && (
          <>
            {cart.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-16 border border-white/10 shadow-lg text-center">
                <ShoppingCart size={80} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-white text-2xl font-semibold mb-2">Your cart is empty</h3>
                <p className="text-gray-400 mb-6">Add some medications to get started</p>
                <button
                  onClick={() => setCurrentView("medications")}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white font-semibold hover:shadow-lg transition"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg"
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-purple-700/30">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-white font-semibold text-lg">{item.name}</h3>
                              <p className="text-gray-400 text-sm">{item.description}</p>
                              {item.requiresPrescription && (
                                <span className="inline-flex items-center gap-1 text-xs text-yellow-400 mt-1">
                                  <Package size={12} />
                                  Prescription Required
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-400 hover:text-red-300 transition"
                            >
                              <Trash size={20} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3 bg-purple-700/30 rounded-xl p-2">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-8 rounded-lg bg-purple-600/50 hover:bg-purple-600 text-white transition flex items-center justify-center"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="text-white font-semibold w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-8 h-8 rounded-lg bg-purple-600/50 hover:bg-purple-600 text-white transition flex items-center justify-center"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-gray-400 text-sm">₹{item.price} each</p>
                              <p className="text-green-400 font-bold text-xl">
                                ₹{item.price * item.quantity}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg sticky top-6">
                    <h2 className="font-poppins font-semibold text-2xl text-white mb-6">
                      Order Summary
                    </h2>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-300">
                        <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                        <span className="text-white font-medium">₹{getTotalPrice()}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Delivery Charges</span>
                        <span className="text-green-400 font-medium">
                          {getTotalPrice() >= 4000 ? 'FREE' : '₹50'}
                        </span>
                      </div>
                      <div className="border-t border-white/10 pt-3 mt-3">
                        <div className="flex justify-between text-lg">
                          <span className="text-white font-semibold">Total</span>
                          <span className="text-green-400 font-bold text-2xl">
                            ₹{getTotalPrice() >= 4000 ? getTotalPrice() : getTotalPrice() + 50}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleProceedToCheckout}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-2 mb-4"
                    >
                      <CreditCard size={24} />
                      Proceed to Checkout
                    </button>

                    <button
                      onClick={() => setCurrentView("medications")}
                      className="w-full py-3 bg-white/10 hover:bg-white/15 rounded-xl text-white font-medium transition"
                    >
                      Continue Shopping
                    </button>
                    
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="flex items-start gap-2 text-gray-400 text-sm mb-3">
                        <Truck size={16} className="mt-0.5 flex-shrink-0 text-blue-400" />
                        <span>Free delivery on orders over ₹4000</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-400 text-sm">
                        <Clock size={16} className="mt-0.5 flex-shrink-0 text-blue-400" />
                        <span>Expected delivery in 2-3 business days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Previous Orders Tab Content */}
        {cartTab === "orders" && (
          <div className="space-y-4">
            {previousOrders.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-16 border border-white/10 shadow-lg text-center">
                <ClipboardList size={80} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-white text-2xl font-semibold mb-2">No previous orders</h3>
                <p className="text-gray-400 mb-6">Your order history will appear here</p>
                <button
                  onClick={() => { setCartTab("cart"); setCurrentView("medications"); }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white font-semibold hover:shadow-lg transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              previousOrders.map((order) => (
                <div key={order.id} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white font-semibold text-lg">Order #{order.id}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === "Delivered" 
                            ? "bg-green-500/20 text-green-400" 
                            : order.status === "In Transit"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm flex items-center gap-2">
                        <Clock size={14} />
                        {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Total Amount</p>
                      <p className="text-green-400 font-bold text-xl">₹{order.total}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/10 pt-4 mb-4">
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-300">{item.name} x{item.quantity}</span>
                          <span className="text-white">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 text-gray-400 text-sm bg-purple-700/20 rounded-xl p-3">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>{order.deliveryAddress}</span>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <button className="flex-1 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white font-medium transition flex items-center justify-center gap-2">
                      <ClipboardList size={18} />
                      View Details
                    </button>
                    <button 
                      onClick={() => handleReorder(order.id)}
                      className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white font-medium transition flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={18} />
                      Reorder
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Saved Addresses Tab Content */}
        {cartTab === "addresses" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-semibold text-xl">Your Saved Addresses</h2>
              <button
                onClick={() => {
                  setDeliveryAddress({
                    fullName: "",
                    phone: "",
                    addressLine1: "",
                    addressLine2: "",
                    city: "",
                    state: "",
                    pincode: "",
                    addressType: "home"
                  });
                  setCurrentView("address");
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white font-medium transition flex items-center gap-2 hover:shadow-lg"
              >
                <Plus size={18} />
                Add New Address
              </button>
            </div>
            
            {savedAddresses.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-16 border border-white/10 shadow-lg text-center">
                <MapPin size={80} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-white text-2xl font-semibold mb-2">No saved addresses</h3>
                <p className="text-gray-400 mb-6">Add an address for faster checkout</p>
                <button
                  onClick={() => setCurrentView("address")}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white font-semibold hover:shadow-lg transition"
                >
                  Add Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedAddresses.map((address) => (
                  <div key={address.id} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg relative">
                    {address.isDefault && (
                      <span className="absolute top-4 right-4 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-lg">
                        Default
                      </span>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      {address.addressType === "home" && <Home size={18} className="text-green-400" />}
                      {address.addressType === "work" && <Package size={18} className="text-blue-400" />}
                      {address.addressType === "other" && <MapPin size={18} className="text-purple-400" />}
                      <span className="text-white font-medium capitalize">{address.addressType}</span>
                    </div>
                    
                    <p className="text-white font-semibold mb-1">{address.fullName}</p>
                    <p className="text-gray-300 text-sm">{address.addressLine1}</p>
                    {address.addressLine2 && <p className="text-gray-300 text-sm">{address.addressLine2}</p>}
                    <p className="text-gray-300 text-sm">{address.city}, {address.state} - {address.pincode}</p>
                    <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
                      <Phone size={14} />
                      {address.phone}
                    </p>
                    
                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={() => {
                          setDeliveryAddress({
                            id: address.id,
                            fullName: address.fullName,
                            phone: address.phone,
                            addressLine1: address.addressLine1,
                            addressLine2: address.addressLine2 || '',
                            city: address.city,
                            state: address.state,
                            pincode: address.pincode,
                            addressType: address.addressType
                          });
                          setCurrentView("address");
                        }}
                        className="flex-1 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white font-medium transition flex items-center justify-center gap-2"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(address.id)}
                          className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white font-medium transition flex items-center justify-center gap-2"
                        >
                          <Check size={16} />
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (address.isDefault && savedAddresses.length > 1) {
                            toast.error('Cannot delete default address');
                            return;
                          }
                          handleDeleteAddress(address.id);
                        }}
                        className="py-2 px-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400 transition"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Address View
  if (currentView === "address") {
    return (
      <div className="space-y-6">
        {/* Address Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-8 backdrop-blur-sm border border-purple-500/20 shadow-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView("cart")}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MapPin size={32} className="text-purple-400" />
                <h1 className="font-poppins font-bold text-4xl text-white">
                  Delivery Address
                </h1>
              </div>
              <p className="text-gray-200 text-lg">
                Where should we deliver your order?
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-lg">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-gray-300 mb-2">
                    <User size={16} />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.fullName}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, fullName: e.target.value})}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-300 mb-2">
                    <Phone size={16} />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={deliveryAddress.phone}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-300 mb-2">
                  <MapPin size={16} />
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.addressLine1}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, addressLine1: e.target.value})}
                  placeholder="House No., Building Name"
                  className="w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-300 mb-2">
                  <MapPin size={16} />
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={deliveryAddress.addressLine2}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, addressLine2: e.target.value})}
                  placeholder="Road Name, Area, Colony (Optional)"
                  className="w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-gray-300 mb-2">
                    <MapPin size={16} />
                    City *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                    placeholder="City"
                    className="w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-300 mb-2">
                    <MapPin size={16} />
                    State *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.state}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                    placeholder="State"
                    className="w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-gray-300 mb-2">
                    <MapPin size={16} />
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.pincode}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border bg-purple-700/30 border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 mb-3 block">Address Type</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeliveryAddress({...deliveryAddress, addressType: "home"})}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                      deliveryAddress.addressType === "home"
                        ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                        : "bg-purple-700/30 text-gray-300 hover:text-white"
                    }`}
                  >
                    <Home size={18} />
                    Home
                  </button>
                  <button
                    onClick={() => setDeliveryAddress({...deliveryAddress, addressType: "work"})}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                      deliveryAddress.addressType === "work"
                        ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                        : "bg-purple-700/30 text-gray-300 hover:text-white"
                    }`}
                  >
                    <Package size={18} />
                    Work
                  </button>
                  <button
                    onClick={() => setDeliveryAddress({...deliveryAddress, addressType: "other"})}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                      deliveryAddress.addressType === "other"
                        ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                        : "bg-purple-700/30 text-gray-300 hover:text-white"
                    }`}
                  >
                    <MapPin size={18} />
                    Other
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setCurrentView("cart")}
                  className="flex-1 py-4 bg-white/10 hover:bg-white/15 rounded-xl text-white font-semibold transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Back to Cart
                </button>
                <button
                  onClick={async () => {
                    if (validateAddress()) {
                      // Save address to backend if it's new
                      if (!deliveryAddress.id) {
                        await handleSaveAddress(deliveryAddress);
                      }
                      handleContinueToOrder();
                    }
                  }}
                  disabled={loading}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                  Continue to Order
                  <CreditCard size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Order Confirmation View
  if (currentView === "orderConfirmation") {
    return (
      <div className="space-y-6">
        {/* Order Confirmation Header */}
        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-2xl p-8 backdrop-blur-sm border border-green-500/20 shadow-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView("address")}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CreditCard size={32} className="text-green-400" />
                <h1 className="font-poppins font-bold text-4xl text-white">
                  Order Summary
                </h1>
              </div>
              <p className="text-gray-200 text-lg">
                Review your order before placing
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-poppins font-semibold text-xl text-white flex items-center gap-2">
                  <MapPin size={20} className="text-blue-400" />
                  Delivery Address
                </h2>
                <button
                  onClick={() => setCurrentView("address")}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition text-sm"
                >
                  <Edit size={16} />
                  Edit
                </button>
              </div>
              <div className="bg-purple-700/20 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  {deliveryAddress.addressType === "home" && <Home size={16} className="text-green-400" />}
                  {deliveryAddress.addressType === "work" && <Package size={16} className="text-blue-400" />}
                  {deliveryAddress.addressType === "other" && <MapPin size={16} className="text-purple-400" />}
                  <span className="text-white font-medium capitalize">{deliveryAddress.addressType}</span>
                </div>
                <p className="text-white font-semibold">{deliveryAddress.fullName}</p>
                <p className="text-gray-300">{deliveryAddress.addressLine1}</p>
                {deliveryAddress.addressLine2 && <p className="text-gray-300">{deliveryAddress.addressLine2}</p>}
                <p className="text-gray-300">{deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pincode}</p>
                <p className="text-gray-400 mt-2 flex items-center gap-2">
                  <Phone size={14} />
                  {deliveryAddress.phone}
                </p>
              </div>
            </div>

            {/* Cart Items */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
              <h2 className="font-poppins font-semibold text-xl text-white mb-4 flex items-center gap-2">
                <ShoppingCart size={20} className="text-blue-400" />
                Order Items ({cart.length})
              </h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-purple-700/20 rounded-xl p-4 border border-white/5">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{item.name}</h3>
                      <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                      {item.requiresPrescription && (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-400 mt-1">
                          <Package size={12} />
                          Prescription Required
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">₹{item.price * item.quantity}</p>
                      <p className="text-gray-400 text-sm">₹{item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
              <h2 className="font-poppins font-semibold text-xl text-white mb-4 flex items-center gap-2">
                <Truck size={20} className="text-blue-400" />
                Delivery Information
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Clock size={24} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Estimated Delivery</p>
                  <p className="text-gray-400">2-3 business days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg sticky top-6">
              <h2 className="font-poppins font-semibold text-xl text-white mb-4">
                Payment Summary
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span className="text-white">₹{getTotalPrice()}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Delivery Charges</span>
                  <span className="text-green-400">
                    {getTotalPrice() >= 4000 ? 'FREE' : '₹50'}
                  </span>
                </div>
                {getTotalPrice() < 4000 && (
                  <p className="text-xs text-gray-400">
                    Add ₹{4000 - getTotalPrice()} more for free delivery
                  </p>
                )}
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between">
                    <span className="text-white font-semibold text-lg">Total Amount</span>
                    <span className="text-green-400 font-bold text-2xl">
                      ₹{getTotalPrice() >= 4000 ? getTotalPrice() : getTotalPrice() + 50}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleFinalCheckout}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl text-white font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <CheckCircle size={24} />
                )}
                {loading ? 'Processing...' : 'Place Order'}
              </button>

              <p className="text-gray-400 text-xs text-center">
                By placing order, you agree to our terms and conditions
              </p>

              <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                <div className="flex items-start gap-2 text-gray-400 text-sm">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-green-400" />
                  <span>Cash on Delivery available</span>
                </div>
                <div className="flex items-start gap-2 text-gray-400 text-sm">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-green-400" />
                  <span>7-day return policy</span>
                </div>
                <div className="flex items-start gap-2 text-gray-400 text-sm">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-green-400" />
                  <span>100% authentic products</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Medications View (Default)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-2xl p-8 backdrop-blur-sm border border-blue-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Pill size={32} className="text-blue-400" />
              <h1 className="font-poppins font-bold text-4xl text-white">
                Medication Store
              </h1>
            </div>
            <p className="text-gray-200 text-lg">
              Order your medications online with fast delivery
            </p>
          </div>
          
          <button
            onClick={() => setCurrentView("cart")}
            className="relative px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white font-semibold hover:shadow-lg transition flex items-center gap-2"
          >
            <ShoppingCart size={20} />
            <span>Cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medications..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-purple-700/30 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition ${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                      : "bg-purple-700/30 text-gray-300 hover:text-white border border-white/10 hover:border-blue-500/50"
                  }`}
                >
                  <Icon size={18} />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Medications Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMedications.map((medication) => (
          <div
            key={medication.id}
            className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all shadow-lg hover:shadow-2xl group"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={medication.image}
                alt={medication.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              {!medication.inStock && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">Out of Stock</span>
                </div>
              )}
              {medication.requiresPrescription && (
                <div className="absolute top-3 left-3 px-3 py-1 bg-red-500/90 rounded-lg text-white text-xs font-semibold flex items-center gap-1">
                  <Package size={14} />
                  Prescription Required
                </div>
              )}
              <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 rounded-lg text-yellow-400 text-sm font-semibold flex items-center gap-1">
                <Star size={14} fill="currentColor" />
                {medication.rating}
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-white font-semibold text-lg mb-1">{medication.name}</h3>
              <p className="text-gray-400 text-sm mb-3">{medication.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-green-400 text-2xl font-bold">₹{medication.price}</span>
                <span className="text-gray-400 text-sm">{medication.reviews} reviews</span>
              </div>
              
              <button
                onClick={() => addToCart(medication)}
                disabled={!medication.inStock}
                className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                  medication.inStock
                    ? "bg-gradient-to-r from-blue-500 to-green-500 text-white hover:shadow-lg"
                    : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                }`}
              >
                <ShoppingCart size={18} />
                {medication.inStock ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMedications.length === 0 && (
        <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <Package size={64} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-white text-xl font-semibold mb-2">No medications found</h3>
          <p className="text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}


      {/* Prescription Upload Modal */}
      {showPrescriptionUpload && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-purple-800/95 backdrop-blur-md rounded-2xl max-w-md w-full border border-white/20 shadow-2xl p-8">
            <h2 className="font-poppins font-bold text-2xl text-white mb-4 flex items-center gap-2">
              <Upload size={28} className="text-blue-400" />
              Upload Prescription
            </h2>
            
            <p className="text-gray-300 mb-6">
              Some items in your cart require a valid prescription. Please upload your prescription to continue.
            </p>
            
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 mb-6 text-center hover:border-blue-500/50 transition cursor-pointer">
              <Upload size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-white font-medium mb-1">Click to upload prescription</p>
              <p className="text-gray-400 text-sm">PDF, JPG, or PNG (Max 5MB)</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowPrescriptionUpload(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition border border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handlePrescriptionUpload}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Confirm & Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MedicationSection;
