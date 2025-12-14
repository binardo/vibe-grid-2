import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GridLibrary } from './pages/GridLibrary';
import { GridScreen } from './pages/GridScreen';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-slate-50 to-blue-50">
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none"
          style={{ backgroundImage: 'url(/background.png)' }}
        />
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<GridLibrary />} />
            <Route path="/grid/:gridId" element={<GridScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
