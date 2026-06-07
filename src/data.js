const now = new Date();

const minutesFromNow = (minutes) => {
  const date = new Date(now);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
};

export const drivers = [
  {
    id: "drv_001",
    name: "Avery Carter",
    phone: "555-0101",
    vehicle: "Box Truck 24ft",
    status: "on_job",
    currentLocation: "North Yard",
    activeJobId: "job_003",
    updatedAt: minutesFromNow(-40)
  },
  {
    id: "drv_002",
    name: "Jordan Lee",
    phone: "555-0102",
    vehicle: "Sprinter Van",
    status: "on_job",
    currentLocation: "Downtown",
    activeJobId: "job_002",
    updatedAt: minutesFromNow(-8)
  },
  {
    id: "drv_003",
    name: "Sam Rivera",
    phone: "555-0103",
    vehicle: "Flatbed",
    status: "off_duty",
    currentLocation: "West Depot",
    activeJobId: null,
    updatedAt: minutesFromNow(-120)
  },
  {
    id: "drv_004",
    name: "Morgan Patel",
    phone: "555-0104",
    vehicle: "Cargo Van",
    status: "available",
    currentLocation: "Central Depot",
    activeJobId: null,
    updatedAt: minutesFromNow(-15)
  }
];

export const jobs = [
  {
    id: "job_001",
    title: "Pickup pallets from Acme Supply",
    customerName: "Acme Supply",
    contactName: "Riley Morgan",
    contactPhone: "555-0201",
    pickupAddress: "1400 Industrial Pkwy, Dallas, TX",
    dropoffAddress: "810 Market St, Fort Worth, TX",
    priority: "high",
    status: "new",
    assignedDriverId: null,
    requestedPickupAt: minutesFromNow(45),
    dueAt: minutesFromNow(180),
    notes: "Dock 3. Ask for Riley at receiving.",
    createdAt: minutesFromNow(-30),
    updatedAt: minutesFromNow(-30),
    statusUpdates: [
      {
        id: "upd_001",
        status: "new",
        message: "Job created from customer request.",
        createdAt: minutesFromNow(-30)
      }
    ]
  },
  {
    id: "job_002",
    title: "Deliver parts to Metro Auto",
    customerName: "Metro Auto",
    contactName: "Casey Brooks",
    contactPhone: "555-0202",
    pickupAddress: "500 Commerce Blvd, Irving, TX",
    dropoffAddress: "220 Service Rd, Arlington, TX",
    priority: "normal",
    status: "in_progress",
    assignedDriverId: "drv_002",
    requestedPickupAt: minutesFromNow(-60),
    dueAt: minutesFromNow(70),
    notes: "Parts are prepaid. Signature required.",
    createdAt: minutesFromNow(-150),
    updatedAt: minutesFromNow(-8),
    statusUpdates: [
      {
        id: "upd_002",
        status: "assigned",
        message: "Assigned to Jordan Lee.",
        driverId: "drv_002",
        createdAt: minutesFromNow(-90)
      },
      {
        id: "upd_003",
        status: "in_progress",
        message: "Driver picked up the order.",
        driverId: "drv_002",
        createdAt: minutesFromNow(-8)
      }
    ]
  },
  {
    id: "job_003",
    title: "Furniture delivery for Oak & Pine",
    customerName: "Oak & Pine",
    contactName: "Taylor Kim",
    contactPhone: "555-0203",
    pickupAddress: "77 Warehouse Way, Plano, TX",
    dropoffAddress: "19 Lakeside Dr, Frisco, TX",
    priority: "normal",
    status: "assigned",
    assignedDriverId: "drv_001",
    requestedPickupAt: minutesFromNow(25),
    dueAt: minutesFromNow(150),
    notes: "Two-person load, curbside drop.",
    createdAt: minutesFromNow(-70),
    updatedAt: minutesFromNow(-20),
    statusUpdates: [
      {
        id: "upd_004",
        status: "assigned",
        message: "Assigned to Avery Carter.",
        driverId: "drv_001",
        createdAt: minutesFromNow(-20)
      }
    ]
  }
];
