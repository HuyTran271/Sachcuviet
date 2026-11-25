import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Home from './pages/Home/Home';
import Profile from './pages/Profile/Profile';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import ShopPublic from './pages/ShopPublic/ShopPublic';
import MyShop from './pages/MyShop/MyShop';
import ProductForm from './pages/ProductForm/ProductForm';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import Orders from './pages/Orders/Orders';
import SellerOrders from './pages/SellerOrders/SellerOrders';
import Admin from './pages/Admin/Admin';
import PrivateRoute from './components/common/PrivateRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/shops/:id" element={<ShopPublic />} />
      <Route element={<PrivateRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-shop" element={<MyShop />} />
        <Route path="/my-products/new" element={<ProductForm />} />
        <Route path="/my-products/:id/edit" element={<ProductForm />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/seller-orders" element={<SellerOrders />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
