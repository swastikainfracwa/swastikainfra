# Google Maps Setup Guide

This guide will help you set up Google Maps integration for the property location picker feature.

## Overview

The application uses Google Maps API to provide:
- 🗺️ Interactive map for selecting property locations
- 📍 Drag-and-drop marker placement
- 🔍 Location search with autocomplete
- 📱 Current location detection
- 🌍 Reverse geocoding (convert coordinates to addresses)

## Prerequisites

- A Google Cloud account (free tier available)
- A credit card (required for Google Cloud, but you won't be charged unless you exceed free tier limits)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Swastika Infra")
5. Click **"Create"**

## Step 2: Enable Required APIs

You need to enable three APIs for the location picker to work:

1. In the Google Cloud Console, go to **"APIs & Services" > "Library"**
2. Search for and enable the following APIs (click each and press "Enable"):
   - **Maps JavaScript API** - For displaying the interactive map
   - **Places API** - For location search and autocomplete
   - **Geocoding API** - For converting addresses to coordinates and vice versa

## Step 3: Create an API Key

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Your new API key will be displayed - **COPY IT IMMEDIATELY**

## Step 4: Restrict Your API Key (Recommended for Security)

### Application Restrictions

1. Click on your newly created API key to edit it
2. Under **"Application restrictions"**, select:
   - **HTTP referrers (web sites)** for production
   - Add your domains:
     ```
     localhost:*
     http://localhost:*
     https://localhost:*
     https://yourdomain.com/*
     ```

### API Restrictions

1. In the same screen, scroll to **"API restrictions"**
2. Select **"Restrict key"**
3. Choose only the APIs you need:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Click **"Save"**

## Step 5: Configure Your Environment

1. If you haven't already, copy `.env.example` to `.env.local`:
   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Open `.env.local` and add your Google Maps API key:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your-actual-key-here
   ```

3. Make sure `.env.local` is in your `.gitignore` (it should be by default)

## Step 6: Test the Integration

1. Start your development server:
   ```powershell
   npm run dev
   # or
   bun run dev
   ```

2. Navigate to the Add Property page (as admin, manager, agent, or owner)

3. You should see:
   - An interactive Google Map
   - A search bar with autocomplete
   - A "Use Current Location" button
   - The ability to click or drag markers on the map

## Troubleshooting

### Map Not Loading

**Issue**: Map shows a blank gray box or error message

**Solutions**:
1. Check that your API key is correctly set in `.env.local`
2. Restart your development server after adding the API key
3. Open browser console (F12) to see specific error messages
4. Verify all three APIs are enabled in Google Cloud Console

### "This page can't load Google Maps correctly"

**Issue**: Map loads but shows an error overlay

**Solutions**:
1. Check if billing is enabled on your Google Cloud project
2. Verify your API key restrictions aren't too strict
3. Make sure the Maps JavaScript API is enabled

### Search Not Working

**Issue**: Location search or autocomplete not functioning

**Solutions**:
1. Verify the **Places API** is enabled
2. Check browser console for API errors
3. Ensure your API key has permission to use Places API

### Reverse Geocoding Fails

**Issue**: Clicking on map doesn't show address

**Solutions**:
1. Verify the **Geocoding API** is enabled
2. Check browser console for quota or permission errors

## Pricing Information

### Free Tier (Monthly)

Google Maps provides generous free tier limits:
- **Maps JavaScript API**: $200 free credit (≈28,000 map loads)
- **Places API**: $200 free credit (≈17,000 requests)
- **Geocoding API**: $200 free credit (≈40,000 requests)

### Cost Management

1. Set up budget alerts in Google Cloud Console
2. Enable billing alerts at 50%, 90%, and 100% of your budget
3. For production, consider implementing:
   - Server-side caching of geocoding results
   - Rate limiting on location searches
   - Loading maps only when needed

## Features of the Location Picker

### For Users

- **Search**: Type an address to quickly locate properties
- **Click to Place**: Click anywhere on the map to set a marker
- **Drag Marker**: Drag the marker to fine-tune the exact location
- **Current Location**: Use GPS to auto-fill your current location
- **Auto-fill**: City and state fields are automatically populated

### For Developers

The `LocationPicker` component returns:
```typescript
interface LocationData {
  address: string;        // Full formatted address
  latitude: number;       // Latitude coordinate
  longitude: number;      // Longitude coordinate  
  city?: string;         // Extracted city name
  state?: string;        // Extracted state name
}
```

## Component Usage

The LocationPicker is already integrated in `AddPropertyModal.tsx`:

```tsx
<LocationPicker
  value={locationData || undefined}
  onChange={(location) => {
    setLocationData(location);
    form.setValue('location', location.address);
    if (location.city) form.setValue('city', location.city);
    if (location.state) form.setValue('state', location.state);
  }}
/>
```

## Security Best Practices

1. ✅ **Never commit API keys to git** - Use `.env.local` and ensure it's in `.gitignore`
2. ✅ **Restrict your API key** - Add domain restrictions in Google Cloud Console
3. ✅ **Enable only required APIs** - Don't give your key access to unnecessary APIs
4. ✅ **Monitor usage** - Set up billing alerts and check usage regularly
5. ✅ **Rotate keys** - If a key is exposed, delete it and create a new one immediately

## Additional Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure all required APIs are enabled
4. Check Google Cloud Console for API quota and billing status

---

**Note**: The Google Maps integration is already built into your application. You only need to obtain and configure the API key to activate it.
