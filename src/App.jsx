import { BrowserRouter,Routes,Route} from "react-router-dom";
import Home from "./pages/Home";
import Subjects from './pages/Subjects';
import Login from "./components/Login";
import AdminDasboard from "./components/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import Student from "./pages/Student";
import Parent from "./pages/Parent";
import CoursesPage from "./pages/CoursesPage";
import PayHereCheckout from "./pages/PayHereCheckout";


function App() {
  
  return (
    <BrowserRouter>
    <Routes>
        <Route element={<Home/>} path="/"/>
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDasboard />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/student" element={<Student />} />
        <Route path="/parent" element={<Parent />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/payment" element={<PayHereCheckout />} />
    </Routes>
    </BrowserRouter>
   
  );
}

export default App;