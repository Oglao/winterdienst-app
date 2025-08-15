import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getGPSErrorInfo, logGPSError, HAMBURG_FALLBACK } from '../../utils/gpsErrorHandler';

const GPSTestHelper = () => {
  const [testResult, setTestResult] = useState(null);

  const testGPSError = (errorCode) => {
    // Simulate GeolocationPositionError
    const mockError = {
      code: errorCode,
      message: `Simulated GPS error with code ${errorCode}`,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    };

    const errorInfo = logGPSError(mockError, 'GPSTestHelper');
    setTestResult(errorInfo);
  };

  const testGPSSuccess = () => {
    setTestResult({
      success: true,
      position: HAMBURG_FALLBACK,
      message: 'GPS simulation successful'
    });
  };

  const clearTest = () => {
    setTestResult(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 GPS Error Handler Test</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => testGPSError(1)}
          className="px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
        >
          Test Permission Denied
        </button>
        <button
          onClick={() => testGPSError(2)}
          className="px-3 py-2 bg-orange-100 text-orange-800 rounded hover:bg-orange-200 text-sm"
        >
          Test Position Unavailable
        </button>
        <button
          onClick={() => testGPSError(3)}
          className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm"
        >
          Test Timeout
        </button>
        <button
          onClick={testGPSSuccess}
          className="px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm"
        >
          Test Success
        </button>
      </div>

      <button
        onClick={clearTest}
        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm mb-4"
      >
        Clear Test
      </button>

      {testResult && (
        <div className={`p-4 rounded-lg ${
          testResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start space-x-3">
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              {testResult.success ? (
                <div>
                  <p className="font-medium text-green-900">GPS Test Successful</p>
                  <p className="text-sm text-green-700 mt-1">
                    Position: {testResult.position.latitude}, {testResult.position.longitude}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-red-900">{testResult.userFriendlyMessage}</p>
                  <p className="text-sm text-red-700 mt-1">Code: {testResult.code}</p>
                  {testResult.recommendation && (
                    <p className="text-sm text-blue-700 mt-2">💡 {testResult.recommendation}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <AlertTriangle className="h-4 w-4 inline mr-2" />
        Dieser Test simuliert GPS-Fehler ohne echten GPS-Zugriff. 
        Die Fehlerbehandlung wird nun benutzerfreundlich angezeigt.
      </div>
    </div>
  );
};

export default GPSTestHelper;