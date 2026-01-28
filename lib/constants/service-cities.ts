export interface ServiceCityConfig {
  name: string;
  state: string;
  stateCode: string;
  timezone: string;
  averageSnowfall: number; // inches per year
  boroughs?: string[]; // For NYC
  streetApiConfig?: {
    enabled: boolean;
    provider: 'nyc_opendata' | 'city_api' | 'state_dot' | 'custom';
    baseUrl: string;
    endpoints: {
      plowStatus?: string;
      streetList?: string;
      realTime?: string;
    };
  };
}

export const SERVICE_CITIES: ServiceCityConfig[] = [
  // NYC Boroughs (treated as one city with boroughs)
  {
    name: 'New York City',
    state: 'New York',
    stateCode: 'NY',
    timezone: 'America/New_York',
    averageSnowfall: 25.8,
    boroughs: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
    streetApiConfig: {
      enabled: true,
      provider: 'nyc_opendata',
      baseUrl: 'https://data.cityofnewyork.us/resource',
      endpoints: {
        plowStatus: '/nziy-gvf4.json', // NYC PlowNYC data
        streetList: '/8rma-cm9c.json', // Street centerlines
      },
    },
  },
  
  // Top 20 Snowiest US Cities
  {
    name: 'Syracuse',
    state: 'New York',
    stateCode: 'NY',
    timezone: 'America/New_York',
    averageSnowfall: 127.8,
  },
  {
    name: 'Rochester',
    state: 'New York',
    stateCode: 'NY',
    timezone: 'America/New_York',
    averageSnowfall: 99.5,
  },
  {
    name: 'Buffalo',
    state: 'New York',
    stateCode: 'NY',
    timezone: 'America/New_York',
    averageSnowfall: 95.4,
    streetApiConfig: {
      enabled: true,
      provider: 'city_api',
      baseUrl: 'https://data.buffalony.gov/resource',
      endpoints: {
        plowStatus: '/snow-plow-data.json',
      },
    },
  },
  {
    name: 'Cleveland',
    state: 'Ohio',
    stateCode: 'OH',
    timezone: 'America/New_York',
    averageSnowfall: 68.9,
  },
  {
    name: 'Pittsburgh',
    state: 'Pennsylvania',
    stateCode: 'PA',
    timezone: 'America/New_York',
    averageSnowfall: 44.3,
  },
  {
    name: 'Detroit',
    state: 'Michigan',
    stateCode: 'MI',
    timezone: 'America/Detroit',
    averageSnowfall: 42.7,
  },
  {
    name: 'Milwaukee',
    state: 'Wisconsin',
    stateCode: 'WI',
    timezone: 'America/Chicago',
    averageSnowfall: 51.5,
  },
  {
    name: 'Minneapolis',
    state: 'Minnesota',
    stateCode: 'MN',
    timezone: 'America/Chicago',
    averageSnowfall: 54.4,
    streetApiConfig: {
      enabled: true,
      provider: 'city_api',
      baseUrl: 'https://opendata.minneapolismn.gov/api',
      endpoints: {
        plowStatus: '/snow-emergency.json',
      },
    },
  },
  {
    name: 'Chicago',
    state: 'Illinois',
    stateCode: 'IL',
    timezone: 'America/Chicago',
    averageSnowfall: 36.7,
    streetApiConfig: {
      enabled: true,
      provider: 'city_api',
      baseUrl: 'https://data.cityofchicago.org/resource',
      endpoints: {
        plowStatus: '/snow-plow-tracker.json',
      },
    },
  },
  {
    name: 'Denver',
    state: 'Colorado',
    stateCode: 'CO',
    timezone: 'America/Denver',
    averageSnowfall: 56.5,
    streetApiConfig: {
      enabled: true,
      provider: 'city_api',
      baseUrl: 'https://www.denvergov.org/opendata',
      endpoints: {
        plowStatus: '/snow-routes.json',
      },
    },
  },
  {
    name: 'Salt Lake City',
    state: 'Utah',
    stateCode: 'UT',
    timezone: 'America/Denver',
    averageSnowfall: 56.6,
  },
  {
    name: 'Boston',
    state: 'Massachusetts',
    stateCode: 'MA',
    timezone: 'America/New_York',
    averageSnowfall: 48.1,
    streetApiConfig: {
      enabled: true,
      provider: 'city_api',
      baseUrl: 'https://data.boston.gov/api/3/action',
      endpoints: {
        plowStatus: '/datastore_search?resource_id=snow-plow',
      },
    },
  },
  {
    name: 'Portland',
    state: 'Maine',
    stateCode: 'ME',
    timezone: 'America/New_York',
    averageSnowfall: 62.3,
  },
  {
    name: 'Burlington',
    state: 'Vermont',
    stateCode: 'VT',
    timezone: 'America/New_York',
    averageSnowfall: 81.2,
  },
  {
    name: 'Anchorage',
    state: 'Alaska',
    stateCode: 'AK',
    timezone: 'America/Anchorage',
    averageSnowfall: 74.5,
  },
  {
    name: 'Madison',
    state: 'Wisconsin',
    stateCode: 'WI',
    timezone: 'America/Chicago',
    averageSnowfall: 51.5,
  },
  {
    name: 'Grand Rapids',
    state: 'Michigan',
    stateCode: 'MI',
    timezone: 'America/Detroit',
    averageSnowfall: 75.5,
  },
  {
    name: 'Hartford',
    state: 'Connecticut',
    stateCode: 'CT',
    timezone: 'America/New_York',
    averageSnowfall: 46.2,
  },
  {
    name: 'Indianapolis',
    state: 'Indiana',
    stateCode: 'IN',
    timezone: 'America/Indiana/Indianapolis',
    averageSnowfall: 25.8,
  },
  {
    name: 'Columbus',
    state: 'Ohio',
    stateCode: 'OH',
    timezone: 'America/New_York',
    averageSnowfall: 27.5,
  },
];

