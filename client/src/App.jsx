import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import LostItems from './pages/LostItems';
import FoundItems from './pages/FoundItems';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import MyReports from './pages/MyReports';
import AdminUsers from './pages/AdminUsers';
import AdminReports from './pages/AdminReports';
import Login from './Register/Login';
import Register from './Register/Register';
import LostItemMatches from './pages/LostItemMatches'; 
import SearchItems from './pages/SearchItems'; // New import

function App() {
  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lostItems" element={<LostItems />} />
          <Route path="/foundItems" element={<FoundItems />} />
          <Route path="/reportLost" element={<ReportLost />} />
          <Route path="/reportFound" element={<ReportFound />} />
          <Route path="/myReports" element={<MyReports />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reports" element={<AdminReports />} /> 
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Route for displaying matches for a specific lost item */}
          <Route path="/lostItems/:lostReportId/matches" element={<LostItemMatches />} />
          <Route path="/search" element={<SearchItems />} /> {/* New route for search functionality */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;