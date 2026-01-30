import React, { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    safeThreshold: 50,
    mediumThreshold: 70,
    anomalyThreshold: 2.5,
    riskScaleMultiplier: 25,
    enableNotifications: true,
    emailAlerts: true,
    highRiskOnly: false,
    currency: 'INR'
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || value
    }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('finomaly_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const defaults = {
      safeThreshold: 50,
      mediumThreshold: 70,
      anomalyThreshold: 2.5,
      riskScaleMultiplier: 25,
      enableNotifications: true,
      emailAlerts: true,
      highRiskOnly: false,
      currency: 'INR'
    };
    setSettings(defaults);
    localStorage.removeItem('finomaly_settings');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Settings</h2>
        <p className="text-gray-600 text-lg">Configure Finomaly risk detection parameters</p>
      </div>

      {saved && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          ✓ Settings saved successfully
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Score Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Risk Score Configuration</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safe Risk Threshold (0-100)
              </label>
              <input
                type="number"
                name="safeThreshold"
                value={settings.safeThreshold}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Scores ≤ {settings.safeThreshold} are marked as Safe</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medium Risk Threshold (0-100)
              </label>
              <input
                type="number"
                name="mediumThreshold"
                value={settings.mediumThreshold}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Scores between {settings.safeThreshold} and {settings.mediumThreshold} are Medium</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Scale Multiplier
              </label>
              <input
                type="number"
                name="riskScaleMultiplier"
                value={settings.riskScaleMultiplier}
                onChange={handleChange}
                min="10"
                max="50"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Formula: Risk Score = |Z-Score| × {settings.riskScaleMultiplier}</p>
            </div>
          </div>
        </div>

        {/* Anomaly Detection Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Anomaly Detection</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anomaly Z-Score Threshold
              </label>
              <input
                type="number"
                name="anomalyThreshold"
                value={settings.anomalyThreshold}
                onChange={handleChange}
                min="1"
                max="5"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Transactions with |Z-Score| > {settings.anomalyThreshold} are flagged</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Notifications</h3>
          
          <div className="space-y-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="enableNotifications"
                checked={settings.enableNotifications}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700">Enable all notifications</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="emailAlerts"
                checked={settings.emailAlerts}
                onChange={handleChange}
                disabled={!settings.enableNotifications}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-3 text-gray-700">Email alerts for high-risk transactions</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="highRiskOnly"
                checked={settings.highRiskOnly}
                onChange={handleChange}
                disabled={!settings.enableNotifications}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="ml-3 text-gray-700">Alert only for High risk (skip Medium)</span>
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Configuration</h3>
          
          <div className="space-y-2 text-sm">
            <p><strong>Safe:</strong> 0 - {settings.safeThreshold}</p>
            <p><strong>Medium:</strong> {settings.safeThreshold + 1} - {settings.mediumThreshold}</p>
            <p><strong>High:</strong> {settings.mediumThreshold + 1} - 100</p>
            <p className="mt-4"><strong>Anomaly Threshold:</strong> |Z-Score| > {settings.anomalyThreshold}</p>
            <p><strong>Currency:</strong> {settings.currency}</p>
            <p><strong>Notifications:</strong> {settings.enableNotifications ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
        >
          Save Settings
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-semibold"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Documentation */}
      <div className="mt-12 bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentation</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Safe Threshold:</strong> Transactions with risk scores at or below this value are considered safe.
          </p>
          <p>
            <strong>Medium Threshold:</strong> Transactions between Safe and Medium thresholds are flagged for review.
          </p>
          <p>
            <strong>Anomaly Threshold:</strong> Statistical threshold for flagging unusual transactions. Lower values = stricter detection.
          </p>
          <p>
            <strong>Risk Scale Multiplier:</strong> Controls sensitivity of risk score calculation. Higher values = more sensitive.
          </p>
          <p className="text-xs text-gray-500 mt-4">
            For detailed information, see <a href="/RISK_SCORE_CALCULATION.md" className="text-blue-600 hover:underline">RISK_SCORE_CALCULATION.md</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
