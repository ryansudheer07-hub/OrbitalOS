# Complete Setup Guide for Satellite Visualizer

## 🚀 Quick Start

1. **Install required dependencies**:
   ```bash
   npm install satellite.js framer-motion react-hot-toast lucide-react
   ```

2. **Set up environment variables**:
   Create a `.env` file in your frontend directory:
   ```env
   VITE_CESIUM_ION_TOKEN=your_cesium_ion_token_here
   VITE_N2YO_API_KEY=your_n2yo_api_key_here
   ```

3. **Get your API keys**:

## 🗝️ API Keys Setup

### 1. Cesium Ion Token (Required for Earth imagery)
- Go to [Cesium Ion](https://cesium.com/ion/)
- Sign up for a free account
- Go to Access Tokens section
- Copy your default access token
- Add to `.env` as `VITE_CESIUM_ION_TOKEN`

### 2. N2YO API Key (Optional but recommended)
- Go to [N2YO.com](https://www.n2yo.com/api/)
- Sign up for a free account
- Get your API key (1000 calls/hour free)
- Add to `.env` as `VITE_N2YO_API_KEY`

### 3. Alternative: Use CelesTrak (No API key needed)
If you don't want to use N2YO, the app will automatically fall back to CelesTrak data, which is free but requires orbital calculations.

## 🎨 Design Features

Your new satellite visualizer includes:

### Visual Features:
- **3D Earth Globe**: High-resolution Blue Marble imagery from Cesium Ion
- **Satellite Icons**: Custom SVG icons with color coding by type
- **Real-time Labels**: Satellite names with distance-based scaling
- **Smooth Animations**: Framer Motion powered UI transitions
- **Interactive Selection**: Click satellites to view detailed information

### Control Features:
- **Play/Pause**: Control time animation
- **Time Reset**: Jump back to current time
- **Layer Controls**: Toggle satellites, orbits, ground tracks
- **Real-time Updates**: Automatic position updates every 30 seconds
- **Loading States**: Professional loading indicators

### Data Features:
- **Multiple APIs**: N2YO → CelesTrak → Demo data fallback chain
- **Smart Caching**: 30-second cache to reduce API calls
- **Satellite Categories**: Automatic categorization by name patterns
- **Error Handling**: Graceful degradation when APIs fail

## 🛰️ Satellite Categories

The visualizer automatically categorizes satellites:

- **Communication** (Yellow): Starlink, OneWeb, etc.
- **Weather** (Green): NOAA, GOES, etc.
- **Navigation** (Orange): GPS, GLONASS, Galileo, BeiDou
- **Earth Observation** (Cyan): Landsat, Sentinel, SPOT
- **Scientific** (Purple): Hubble, Chandra, Kepler
- **Space Station** (White): ISS, Chinese Space Station
- **Other** (Gray): Unclassified satellites

## 🔧 Customization Options

### Change Observer Location:
```javascript
const satelliteData = await satelliteService.fetchSatellites({
  observerLat: 51.5074, // London
  observerLng: -0.1278,
  observerAlt: 0,
  searchRadius: 90,
  maxSatellites: 50
})
```

### Add More Satellite Types:
Modify the `categorizeSatellite` method in `satelliteService.js`:
```javascript
if (lowerName.includes('your-satellite-type')) {
  return 'your-category'
}
```

### Change Update Intervals:
```javascript
const SATELLITE_UPDATE_INTERVAL = 30000 // 30 seconds
const CACHE_TIMEOUT = 30000 // 30 seconds
```

## 🌍 Earth Imagery Options

You can change the Earth's appearance by modifying the `imageryProvider`:

### Blue Marble (Current):
```javascript
assetId: 3845 // Blue Marble Next Generation
```

### Earth at Night:
```javascript
assetId: 3812 // Earth at Night
```

### Natural Earth:
```javascript
assetId: 3954 // Natural Earth II
```

## 📊 Data Sources Comparison

| Source | Pros | Cons | Cost |
|--------|------|------|------|
| **N2YO** | Real-time, easy to use, filtered by location | Limited free tier | Free: 1000 calls/hour |
| **CelesTrak** | Free, comprehensive, official TLE data | Requires calculations | Free |
| **Space-Track** | Most comprehensive, official NORAD data | Requires registration | Free |
| **Open Notify** | Simple, no API key needed | ISS only | Free |

## 🚨 Rate Limiting & Best Practices

1. **Cache responses** (already implemented)
2. **Use reasonable update intervals** (30 seconds minimum)
3. **Implement fallback mechanisms** (already implemented)
4. **Monitor API usage**
5. **Consider server-side proxy for production**

## 🎯 Next Steps

1. **Test with demo data**: Run the app without API keys
2. **Add Cesium Ion token**: Get better Earth imagery
3. **Add N2YO API key**: Get real satellite data
4. **Customize observer location**: Set to your preferred location
5. **Add more features**: Orbits, ground tracks, pass predictions

## 🔒 Security Notes

- API keys are only used in the browser (client-side)
- For production, consider using a server-side proxy
- Never commit API keys to version control
- Use environment variables for all sensitive data

## 🐛 Troubleshooting

### Common Issues:

1. **No satellites showing**: Check API keys and network connection
2. **Earth looks pixelated**: Add Cesium Ion token
3. **Console errors**: Check browser's developer tools
4. **API limits exceeded**: Implement caching or use different APIs

### Debug Mode:
Add this to see which data source is being used:
```javascript
console.log('Satellite source:', satelliteData[0]?.source)
```

## 📱 Mobile Considerations

The visualizer works on mobile but consider:
- Touch controls for 3D navigation
- Responsive UI panels
- Reduced satellite count for performance
- Battery usage optimization

Enjoy your new satellite visualizer! 🛰️✨