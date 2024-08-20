import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import LiveVideo from './pages/Live';
import Archive from './pages/Archive';
import AddDevice from './pages/Add-device';
import AddRecording from './pages/AddRecording';
import AddExternalVid from './components/AddExternalVid';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './components/AuthProvider';

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/Home"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route
              path="/Live"
              element={
                <PrivateRoute>
                  <LiveVideo />
                </PrivateRoute>
              }
            />
            <Route
              path="/Archive"
              element={
                <PrivateRoute>
                  <Archive />
                </PrivateRoute>
              }
            />
            <Route
              path="/Add-device"
              element={
                <PrivateRoute>
                  <AddDevice />
                </PrivateRoute>
              }
            />
            <Route
              path='/Add-recording'
              element={
                <PrivateRoute>
                  <AddRecording />
                </PrivateRoute>
              }
            />
            <Route
              path='/youtube-to-rtsp'
              element={
                <PrivateRoute>
                  <AddExternalVid />
                </PrivateRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}
export default App;
