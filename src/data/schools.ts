// School list that powers Passio system selection and campus map centering.
export type School = {
  id: string;
  name: string;
  passioId: number;
  latitude: number;
  longitude: number;
};

export const SCHOOLS: School[] = [
  { id: "agnes-scott", name: "Agnes Scott College", passioId: 1471, latitude: 33.9637, longitude: -84.3705 },
  { id: "alabama-am", name: "Alabama A&M University", passioId: 2456, latitude: 34.7831, longitude: -86.5700 },
  { id: "augusta", name: "Augusta University", passioId: 553, latitude: 33.4754, longitude: -82.0124 },
  { id: "beacon", name: "Beacon College", passioId: 3389, latitude: 29.2108, longitude: -82.1198 },
  { id: "bowie-state", name: "Bowie State University", passioId: 3001, latitude: 39.0064, longitude: -76.7233 },
  { id: "bull-runner", name: "Bull Runner at USF (University of South Florida)", passioId: 2343, latitude: 28.0595, longitude: -82.4133 },
  { id: "cal-state-sb", name: "Cal State San Bernardino", passioId: 1187, latitude: 34.2315, longitude: -117.3210 },
  { id: "chapman", name: "Chapman University", passioId: 263, latitude: 33.9797, longitude: -117.8687 },
  { id: "clemson-tiger", name: "Clemson Tiger Transit", passioId: 1654, latitude: 34.6731, longitude: -82.8364 },
  { id: "clemson", name: "Clemson University", passioId: 793, latitude: 34.6731, longitude: -82.8364 },
  { id: "colby", name: "Colby College", passioId: 3377, latitude: 43.6629, longitude: -69.6591 },
  { id: "columbia", name: "Columbia University", passioId: 74, latitude: 40.8075, longitude: -73.9626 },
  { id: "csulb", name: "CSULB (California State University, Long Beach)", passioId: 4163, latitude: 33.7834, longitude: -118.1141 },
  { id: "eastern-ky", name: "Eastern Kentucky University", passioId: 3828, latitude: 37.9759, longitude: -84.0899 },
  { id: "evms", name: "Eastern Virginia Medical School", passioId: 591, latitude: 36.8500, longitude: -76.2965 },
  { id: "elon", name: "Elon University", passioId: 3045, latitude: 36.0943, longitude: -79.4663 },
  { id: "emory", name: "Emory University", passioId: 4432, latitude: 33.7921, longitude: -84.3230 },
  { id: "endicott", name: "Endicott College", passioId: 2873, latitude: 42.6082, longitude: -70.8551 },
  { id: "fit", name: "FIT NY (Fashion Institute of Technology)", passioId: 973, latitude: 40.7512, longitude: -73.9776 },
  { id: "fgcu", name: "Florida Gulf Coast University (FGCU)", passioId: 2281, latitude: 26.6505, longitude: -81.7610 },
  { id: "fiu", name: "Florida International University", passioId: 4119, latitude: 25.7581, longitude: -80.3743 },
  { id: "fresno-state", name: "Fresno State University", passioId: 805, latitude: 36.7313, longitude: -119.7861 },
  { id: "gw", name: "George Washington University (GW)", passioId: 4120, latitude: 38.8003, longitude: -77.0469 },
  { id: "gcsu", name: "Georgia College & State University (GCSU)", passioId: 895, latitude: 33.0767, longitude: -83.2271 },
  { id: "georgia-southern", name: "Georgia Southern University", passioId: 137, latitude: 32.4243, longitude: -81.7780 },
  { id: "georgia-state", name: "Georgia State University", passioId: 480, latitude: 33.7490, longitude: -84.3880 },
  { id: "harvard", name: "Harvard University", passioId: 831, latitude: 42.3601, longitude: -71.1194 },
  { id: "hollins", name: "Hollins University", passioId: 3014, latitude: 37.3026, longitude: -79.8471 },
  { id: "lehigh", name: "Lehigh University", passioId: 1090, latitude: 40.6064, longitude: -75.3782 },
  { id: "marymount", name: "Marymount University", passioId: 4716, latitude: 38.8526, longitude: -77.1090 },
  { id: "mercy", name: "Mercy University", passioId: 694, latitude: 40.7182, longitude: -73.9821 },
  { id: "missouri-state", name: "Missouri State University", passioId: 459, latitude: 37.2141, longitude: -93.2919 },
  { id: "mit", name: "MIT (Massachusetts Institute of Technology)", passioId: 94, latitude: 42.3596, longitude: -71.0985 },
  { id: "ncsu", name: "NC State University", passioId: 3827, latitude: 35.7796, longitude: -78.6382 },
  { id: "nyu", name: "New York University", passioId: 1007, latitude: 40.7282, longitude: -73.7949 },
  { id: "ncat", name: "North Carolina A&T State University", passioId: 261, latitude: 36.1346, longitude: -79.7712 },
  { id: "pepperdine", name: "Pepperdine University", passioId: 3593, latitude: 34.0395, longitude: -118.6789 },
  { id: "providence", name: "Providence College", passioId: 4147, latitude: 41.8405, longitude: -71.4210 },
  { id: "quinnipiac", name: "Quinnipiac University", passioId: 3899, latitude: 41.4149, longitude: -72.7664 },
  { id: "radford", name: "Radford Transit", passioId: 1248, latitude: 37.1397, longitude: -80.5744 },
  { id: "rit", name: "Rochester Institute of Technology (RIT)", passioId: 4006, latitude: 43.0848, longitude: -77.6759 },
  { id: "rwu", name: "Roger Williams University", passioId: 1850, latitude: 41.6789, longitude: -71.4230 },
  { id: "rutgers", name: "Rutgers University", passioId: 1268, latitude: 40.2206, longitude: -74.4597 },
  { id: "saint-peters", name: "Saint Peter's University", passioId: 493, latitude: 40.7282, longitude: -74.0713 },
  { id: "southeastern-la", name: "Southeastern Louisiana University", passioId: 186, latitude: 30.2231, longitude: -90.6502 },
  { id: "southern-ct", name: "Southern Connecticut State University", passioId: 431, latitude: 41.3083, longitude: -72.9724 },
  { id: "ttu", name: "Tennessee Technological University", passioId: 1736, latitude: 36.3516, longitude: -85.4896 },
  { id: "tulane", name: "Tulane University", passioId: 353, latitude: 29.9391, longitude: -90.1294 },
  { id: "uark", name: "UARK (University of Arkansas)", passioId: 3778, latitude: 36.0726, longitude: -94.1729 },
  { id: "uconn", name: "UCONN/WRTD (University of Connecticut)", passioId: 1541, latitude: 41.8065, longitude: -72.2500 },
  { id: "uncc", name: "UNC Charlotte", passioId: 1053, latitude: 35.3054, longitude: -80.7331 },
  { id: "uncg", name: "UNC Greensboro (UNCG)", passioId: 2874, latitude: 36.0719, longitude: -79.8193 },
  { id: "uncw", name: "UNC Wilmington", passioId: 3952, latitude: 34.2278, longitude: -77.8547 },
  { id: "buffalo", name: "University at Buffalo", passioId: 4882, latitude: 42.8864, longitude: -78.8784 },
  { id: "alabama", name: "University of Alabama", passioId: 240, latitude: 33.2107, longitude: -87.5490 },
  { id: "uchicago", name: "University of Chicago", passioId: 1068, latitude: 41.7858, longitude: -87.6181 },
  { id: "uf", name: "University of Florida (UF)", passioId: 3826, latitude: 29.6436, longitude: -82.3549 },
  { id: "uga", name: "University of Georgia (UGA)", passioId: 3994, latitude: 33.9425, longitude: -83.3761 },
  { id: "hartford", name: "University of Hartford", passioId: 3305, latitude: 41.7836, longitude: -72.6881 },
  { id: "miami-med", name: "University of Miami Medical Center", passioId: 4201, latitude: 25.7617, longitude: -80.2807 },
  { id: "michigan-dearborn", name: "University of Michigan-Dearborn", passioId: 1481, latitude: 42.2990, longitude: -83.1772 },
  { id: "montana", name: "University of Montana (ASUM)", passioId: 4041, latitude: 46.8647, longitude: -113.9850 },
  { id: "new-haven", name: "University of New Haven", passioId: 3900, latitude: 41.3558, longitude: -72.7642 },
  { id: "unm", name: "University of New Mexico (UNM)", passioId: 2156, latitude: 35.0844, longitude: -106.6504 },
  { id: "unng", name: "University of North Georgia", passioId: 646, latitude: 34.3765, longitude: -83.9741 },
  { id: "rochester", name: "University of Rochester", passioId: 3214, latitude: 43.1269, longitude: -77.6395 },
  { id: "usd-tram", name: "University of San Diego Tram Services", passioId: 3444, latitude: 32.7755, longitude: -117.2280 },
  { id: "utep", name: "University of Texas at El Paso (UTEP)", passioId: 2383, latitude: 31.7633, longitude: -106.4425 },
  { id: "uwm", name: "University of Wisconsin-Milwaukee", passioId: 728, latitude: 43.1269, longitude: -87.8710 },
  { id: "usu", name: "Utah State University", passioId: 3499, latitude: 41.7151, longitude: -111.8119 },
  { id: "vanderbilt", name: "Vanderbilt University", passioId: 3622, latitude: 36.1445, longitude: -86.8023 },
  { id: "vanderbilt-med", name: "Vanderbilt University Medical Center", passioId: 1332, latitude: 36.1465, longitude: -86.7887 },
  { id: "wfu", name: "Wake Forest University", passioId: 3669, latitude: 36.1328, longitude: -80.2794 },
  { id: "western-carolina", name: "Western Carolina University", passioId: 2597, latitude: 35.3128, longitude: -82.9923 },
];

export function getSchoolById(id: string): School | undefined {
  return SCHOOLS.find(s => s.id === id);
}

export function getSchoolByPassioId(passioId: number): School | undefined {
  return SCHOOLS.find(s => s.passioId === passioId);
}
