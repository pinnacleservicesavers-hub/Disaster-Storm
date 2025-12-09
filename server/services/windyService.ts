import fetch from 'node-fetch';

interface WindyWebcam {
  id: string;
  title: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    region: string;
    country: string;
  };
  image: {
    current: {
      preview: string;
      icon: string;
      thumbnail: string;
    };
  };
  player: {
    day: {
      embed: string;
    };
  };
}

interface WindyPointForecast {
  ts: number;
  temp: number;
  wind_u: number;
  wind_v: number;
  precip: number;
  pressure: number;
  clouds: number;
  weather: string;
}

export class WindyService {
  private webcamApiKey: string | undefined;
  private pointForecastKey: string | undefined;
  private trafficCamApiKey: string | undefined;

  constructor() {
    this.webcamApiKey = process.env.WINDY_WEBCAM_API_KEY;
    this.pointForecastKey = process.env.WINDY_PINT_FORECAST_KEY;
    this.trafficCamApiKey = process.env.TRAFFIC_CAM_API_KEY;
    
    if (this.webcamApiKey) {
      console.log('✅ Windy Webcam API key configured');
    }
    if (this.trafficCamApiKey) {
      console.log('✅ Traffic Camera API key configured');
    }
  }

  async getWebcamsNearLocation(lat: number, lon: number, radius: number = 50): Promise<WindyWebcam[]> {
    try {
      if (this.webcamApiKey) {
        const response = await fetch(
          `https://api.windy.com/api/webcams/v2/list/nearby=${lat},${lon},${radius}?show=webcams:image,location,player&limit=20`,
          {
            headers: {
              'x-windy-api-key': this.webcamApiKey
            }
          }
        );

        if (response.ok) {
          const data: any = await response.json();
          return data.result?.webcams || [];
        }
      }

      // Return mock data for development
      console.log('Using mock webcam data for development');
      return [
        {
          id: 'webcam-1',
          title: 'Downtown Weather Station',
          status: 'live',
          location: {
            latitude: lat,
            longitude: lon,
            city: 'Weather City',
            region: 'Test Region',
            country: 'USA'
          },
          image: {
            current: {
              preview: 'https://images.windy.com/cam/a0baad85a9d5e8b8d8b8d8b8d8b8d8b8.jpg',
              icon: 'https://images.windy.com/cam/icon.png',
              thumbnail: 'https://images.windy.com/cam/thumb.jpg'
            }
          },
          player: {
            day: {
              embed: 'https://weathercams.windy.com/cam/a0baad85a9d5e8b8d8b8d8b8d8b8d8b8'
            }
          }
        },
        {
          id: 'webcam-2',
          title: 'Airport Runway',
          status: 'live',
          location: {
            latitude: lat + 0.01,
            longitude: lon + 0.01,
            city: 'Weather City',
            region: 'Test Region',
            country: 'USA'
          },
          image: {
            current: {
              preview: 'https://images.windy.com/cam/b1cbbc96b0e6f9c9e9c9e9c9e9c9e9c9.jpg',
              icon: 'https://images.windy.com/cam/icon.png',
              thumbnail: 'https://images.windy.com/cam/thumb.jpg'
            }
          },
          player: {
            day: {
              embed: 'https://weathercams.windy.com/cam/b1cbbc96b0e6f9c9e9c9e9c9e9c9e9c9'
            }
          }
        },
        {
          id: 'webcam-3',
          title: 'Highway Traffic Cam',
          status: 'live',
          location: {
            latitude: lat - 0.01,
            longitude: lon - 0.01,
            city: 'Weather City',
            region: 'Test Region',
            country: 'USA'
          },
          image: {
            current: {
              preview: 'https://images.windy.com/cam/c2dccd07c1f7g0d0f0d0f0d0f0d0f0d0.jpg',
              icon: 'https://images.windy.com/cam/icon.png',
              thumbnail: 'https://images.windy.com/cam/thumb.jpg'
            }
          },
          player: {
            day: {
              embed: 'https://weathercams.windy.com/cam/c2dccd07c1f7g0d0f0d0f0d0f0d0f0d0'
            }
          }
        }
      ];
    } catch (error) {
      console.error('Error fetching Windy webcams:', error);
      return this.getMockWebcams(lat, lon);
    }
  }

  async getWebcamsByRegion(region: string, limit: number = 10): Promise<WindyWebcam[]> {
    try {
      if (this.webcamApiKey) {
        const response = await fetch(
          `https://api.windy.com/api/webcams/v2/list/region=${region}?show=webcams:image,location,player&limit=${limit}`,
          {
            headers: {
              'x-windy-api-key': this.webcamApiKey
            }
          }
        );

        if (response.ok) {
          const data: any = await response.json();
          return data.result?.webcams || [];
        }
      }

      // Return mock data for development
      console.log('Using mock webcam data for development (region)', region);
      return this.getMockWebcams(25.7617, -80.1918);
    } catch (error) {
      console.error('Error fetching Windy webcams by region:', error);
      return this.getMockWebcams(25.7617, -80.1918);
    }
  }

  private getMockWebcams(baseLat: number, baseLon: number): WindyWebcam[] {
    return [
      {
        id: 'webcam-1',
        title: 'Downtown Weather Station',
        status: 'live',
        location: {
          latitude: baseLat,
          longitude: baseLon,
          city: 'Weather City',
          region: 'Test Region',
          country: 'USA'
        },
        image: {
          current: {
            preview: 'https://images.windy.com/cam/a0baad85a9d5e8b8d8b8d8b8d8b8d8b8.jpg',
            icon: 'https://images.windy.com/cam/icon.png',
            thumbnail: 'https://images.windy.com/cam/thumb.jpg'
          }
        },
        player: {
          day: {
            embed: 'https://weathercams.windy.com/cam/a0baad85a9d5e8b8d8b8d8b8d8b8d8b8'
          }
        }
      },
      {
        id: 'webcam-2',
        title: 'Airport Runway',
        status: 'live',
        location: {
          latitude: baseLat + 0.01,
          longitude: baseLon + 0.01,
          city: 'Weather City',
          region: 'Test Region',
          country: 'USA'
        },
        image: {
          current: {
            preview: 'https://images.windy.com/cam/b1cbbc96b0e6f9c9e9c9e9c9e9c9e9c9.jpg',
            icon: 'https://images.windy.com/cam/icon.png',
            thumbnail: 'https://images.windy.com/cam/thumb.jpg'
          }
        },
        player: {
          day: {
            embed: 'https://weathercams.windy.com/cam/b1cbbc96b0e6f9c9e9c9e9c9e9c9e9c9'
          }
        }
      },
      {
        id: 'webcam-3',
        title: 'Highway Traffic Cam',
        status: 'live',
        location: {
          latitude: baseLat - 0.01,
          longitude: baseLon - 0.01,
          city: 'Weather City',
          region: 'Test Region',
          country: 'USA'
        },
        image: {
          current: {
            preview: 'https://images.windy.com/cam/c2dccd07c1f7g0d0f0d0f0d0f0d0f0d0.jpg',
            icon: 'https://images.windy.com/cam/icon.png',
            thumbnail: 'https://images.windy.com/cam/thumb.jpg'
          }
        },
        player: {
          day: {
            embed: 'https://weathercams.windy.com/cam/c2dccd07c1f7g0d0f0d0f0d0f0d0f0d0'
          }
        }
      }
    ];
  }

  async getPointForecast(lat: number, lon: number, model: string = 'gfs'): Promise<WindyPointForecast[]> {
    if (!this.pointForecastKey) {
      console.warn('Windy Point Forecast API key not configured');
      return [];
    }

    try {
      const response = await fetch('https://api.windy.com/api/point-forecast/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: parseFloat(lat.toFixed(2)),
          lon: parseFloat(lon.toFixed(2)),
          model: model,
          parameters: ['temp', 'wind', 'windGust', 'rh', 'pressure'],
          levels: ['surface'],
          key: this.pointForecastKey
        })
      });

      if (!response.ok) {
        console.error('Windy Point Forecast API error:', response.status, await response.text());
        return [];
      }

      const data: any = await response.json();
      
      if (!data.ts || !data['temp-surface']) {
        console.warn('No forecast data in response');
        return [];
      }

      const forecasts: WindyPointForecast[] = [];
      for (let i = 0; i < data.ts.length; i++) {
        const temp = data['temp-surface'][i];
        const wind_u = data['wind_u-surface']?.[i] || 0;
        const wind_v = data['wind_v-surface']?.[i] || 0;
        const pressure = data['pressure-surface']?.[i] || 0;
        const rh = data['rh-surface']?.[i] || 0;
        
        forecasts.push({
          ts: data.ts[i] * 1000,
          temp: temp,
          wind_u: wind_u,
          wind_v: wind_v,
          precip: 0,
          pressure: pressure,
          clouds: Math.max(0, 100 - rh),
          weather: this.getWeatherDescription(temp, 0, Math.max(0, 100 - rh))
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Error fetching Windy point forecast:', error);
      return [];
    }
  }

  private getWeatherDescription(temp: number, precip: number, clouds: number): string {
    if (precip > 5) return 'Heavy Rain';
    if (precip > 1) return 'Light Rain';
    if (clouds > 80) return 'Overcast';
    if (clouds > 50) return 'Partly Cloudy';
    if (clouds > 20) return 'Mostly Sunny';
    return 'Clear';
  }

  calculateWindSpeed(wind_u: number, wind_v: number): number {
    return Math.sqrt(wind_u * wind_u + wind_v * wind_v);
  }

  calculateWindDirection(wind_u: number, wind_v: number): number {
    return (Math.atan2(wind_u, wind_v) * 180 / Math.PI + 180) % 360;
  }
}

export const windyService = new WindyService();
