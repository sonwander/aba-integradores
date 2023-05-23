import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import Geocode from 'react-geocode';

const API_KEY = 'AIzaSyBJCe2qyEnsGHllpjGiF8k9efwnYYe5Ylk';

const useScript = (url) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [url]);

  return scriptLoaded;
};

const MapContainer = () => {
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const autocompleteRef = useRef(null);
  const stores = [
    { name: 'Store A', location: { lat: 40.712776, lng: -74.005974 } },
    { name: 'Store B', location: { lat: 34.052235, lng: -118.243683 } },
    // Add more stores as needed
  ];

  useEffect(() => {
    Geocode.setApiKey(API_KEY);
  }, []);

  useEffect(() => {
    if (navigator.geolocation && searchQuery === '') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter({ lat: latitude, lng: longitude });
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    } else if (searchQuery !== '') {
      Geocode.fromAddress(searchQuery)
        .then((response) => {
          const { lat, lng } = response.results[0].geometry.location;
          setCenter({ lat, lng });
          setUserLocation({ lat, lng });
        })
        .catch((error) => {
          console.error('Error geocoding address:', error);
        });
    }
  }, [searchQuery]);

  const handleMapLoad = (mapInstance) => {
    setMap(mapInstance);
    if (window.google && window.google.maps) {
      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.geometry) {
          setCenter({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
          setSearchQuery(place.formatted_address);
        }
      });
    }
  };

  const scriptLoaded = useScript(`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=geometry`);

  const calculateDistance = (location1, location2) => {
    if (scriptLoaded && window.google && window.google.maps) {
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(location1),
        new window.google.maps.LatLng(location2)
      );
      return distance.toFixed(2);
    }
    return '';
  };

  const handleMarkerClick = (store) => {
    setSelectedStore(store);
  };

  const handleSearchQueryChange = (event) => {
    setSearchQuery(event.target.value);
  };

  return (
    <div className="container" style={{ height: '100vh', width: '100%' }}>
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchQueryChange}
        placeholder="Enter a zipcode or address"
        ref={autocompleteRef}
      />
      {scriptLoaded && (
        <GoogleMap
          onLoad={handleMapLoad}
          center={center}
          zoom={13}
          mapContainerStyle={{ height: '100%', width: '100%' }}
        >
          {userLocation && <Marker position={userLocation} />}
          {stores.map((store, index) => (
            <Marker
              key={index}
              position={store.location}
              onClick={() => handleMarkerClick(store)}
            />
          ))}
          {selectedStore && (
            <InfoWindow
              position={selectedStore.location}
              onCloseClick={() => setSelectedStore(null)}
            >
              <div>
                <h3>{selectedStore.name}</h3>
                <p>
                  Distance: {calculateDistance(userLocation, selectedStore.location)} meters
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      )}
    </div>
  );
};

export default MapContainer;
