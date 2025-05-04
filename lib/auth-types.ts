export type Division = {
  id: string
  name: string
}

export type Department = {
  id: string
  name: string
  divisions: Division[]
}

export type UserRole = "admin" | "head_department"

export type User = {
  id: string
  username: string
  password: string // In a real app, this would be hashed
  role: UserRole
  departmentId?: string
}

// Define departments and divisions
export const departments: Department[] = [
  {
    id: "kabinet",
    name: "Kabinet",
    divisions: [
      { id: "kabinet", name: "Kabinet" }, // Added Kabinet division
    ],
  },
  {
    id: "kesekjenan",
    name: "Kesekjenan",
    divisions: [
      { id: "sekretaris", name: "Sekretaris" },
      { id: "bendahara", name: "Bendahara" },
    ],
  },
  {
    id: "ekonomi_kreatif",
    name: "Ekonomi Kreatif",
    divisions: [
      { id: "kewirausahaan", name: "Kewirausahaan" },
      { id: "sponsorship", name: "Sponsorship" },
    ],
  },
  {
    id: "media_komunikasi",
    name: "Media dan Komunikasi",
    divisions: [
      { id: "hubungan_eksternal", name: "Hubungan Eksternal" },
      { id: "media_publikasi", name: "Media dan Publikasi" },
    ],
  },
  {
    id: "sdm",
    name: "Sumber Daya Manusia",
    divisions: [
      { id: "manajemen_sdm", name: "Managemen Sumber Daya Manusia" },
      { id: "pengembangan_sdm", name: "Pengembangan Sumber Daya Manusia" },
    ],
  },
  {
    id: "kesejahteraan_mahasiswa",
    name: "Kesejahteraan Mahasiswa",
    divisions: [
      { id: "minat_bakat", name: "Minat dan Bakat" },
      { id: "rumah_tangga", name: "Rumah Tangga Himpunan" },
    ],
  },
  {
    id: "riset_teknologi",
    name: "Riset dan Teknologi",
    divisions: [
      { id: "akademik", name: "Akademik" },
      { id: "pengembangan_teknologi", name: "Pengembangan Teknologi" },
    ],
  },
]

// Initial users
export const initialUsers: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123", // In a real app, this would be hashed
    role: "admin",
  },
  {
    id: "2",
    username: "kesekjenan_head",
    password: "dept123",
    role: "head_department",
    departmentId: "kesekjenan",
  },
]

// Helper function to get department name by ID
export function getDepartmentName(departmentId: string): string {
  const department = departments.find((dept) => dept.id === departmentId)
  return department ? department.name : ""
}

// Helper function to get division name by ID
export function getDivisionName(departmentId: string, divisionId: string): string {
  const department = departments.find((dept) => dept.id === departmentId)
  if (!department) return ""

  const division = department.divisions.find((div) => div.id === divisionId)
  return division ? division.name : ""
}

// Helper function to get divisions by department ID
export function getDivisionsByDepartmentId(departmentId: string): Division[] {
  const department = departments.find((dept) => dept.id === departmentId)
  return department ? department.divisions : []
}

// Helper function to get default division for a department
export function getDefaultDivisionForDepartment(departmentId: string): string | undefined {
  // For Kabinet, automatically select the Kabinet division
  if (departmentId === "kabinet") {
    return "kabinet"
  }
  return undefined
}
