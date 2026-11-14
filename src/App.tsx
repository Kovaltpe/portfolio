import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Portfolio } from './pages/Portfolio'
import { Resume } from './pages/Resume'
import { RestaurantDemo } from './pages/RestaurantDemo'
import { StoreDemo } from './pages/StoreDemo'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/demo/paw-pantry" element={<StoreDemo storeId="paw-pantry" />} />
        <Route path="/demo/marea/*" element={<RestaurantDemo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
