# **Database Schema**

## **1. Parcels**

Stores the core parcel record. All other tables link back to this.

**Table:** `Parcels`
**Primary Key:** `parcel_id`

| Column           | Type         | Description                   |
| ---------------- | ------------ | ----------------------------- |
| parcel_id        | VARCHAR(50)  | Unique ID for the parcel      |
| pin              | VARCHAR(50)  | Parcel Identification Number  |
| alt_parcel_num   | VARCHAR(50)  | Alternate parcel number       |
| parno            | VARCHAR(100) | Original parcel number format |
| nparno           | VARCHAR(100) | Normalized parcel number      |
| gis_id           | VARCHAR(50)  | GIS identifier                |
| physical_address | VARCHAR(255) | Street address of the parcel  |
| township         | VARCHAR(100) | Township name                 |
| legal_desc       | TEXT         | Full legal description        |
| plat_cabinet     | VARCHAR(50)  | Plat cabinet reference        |
| plat_slide       | VARCHAR(50)  | Plat slide reference          |
| zoning_code      | VARCHAR(50)  | Zoning classification code    |
| rec_area_num     | VARCHAR(50)  | Recreation/area code          |
| scraped_at       | TIMESTAMP    | When this record was scraped  |

---

## **2. Property_Attributes**

Stores physical and descriptive attributes.
1:1 relationship with `Parcels`.

**Table:** `Property_Attributes`
**Primary Key:** `parcel_id` (FK → `Parcels.parcel_id`)

| Column         | Type          | Description                      |
| -------------- | ------------- | -------------------------------- |
| parcel_id      | VARCHAR(50)   | FK to Parcels                    |
| gis_acres      | DECIMAL(10,2) | Acreage from GIS                 |
| calc_acres     | DECIMAL(10,2) | Calculated acreage               |
| deeded_acres   | DECIMAL(10,2) | Official deeded acreage          |
| classification | VARCHAR(100)  | Property classification          |
| nbhd_code      | VARCHAR(50)   | Neighborhood code                |
| living_units   | INT           | Number of living units           |
| road_type      | VARCHAR(50)   | Road access type                 |
| topography     | VARCHAR(50)   | Topographical classification     |
| utilities      | VARCHAR(50)   | Available utilities              |
| parking        | VARCHAR(50)   | Parking type                     |
| location       | VARCHAR(100)  | Location descriptor              |
| restrictions   | VARCHAR(100)  | Restrictions (zoning, covenants) |
| traffic        | VARCHAR(50)   | Traffic level                    |

---

## **3. Assessments**

Stores taxation and assessment data.
Many assessments per parcel (yearly records).

**Table:** `Assessments`
**Primary Key:** `assessment_id`
**Foreign Key:** `parcel_id` → `Parcels.parcel_id`

| Column         | Type          | Description             |
| -------------- | ------------- | ----------------------- |
| assessment_id  | SERIAL        | Unique assessment entry |
| parcel_id      | VARCHAR(50)   | FK to Parcels           |
| tax_year       | INT           | Tax year                |
| land_value     | DECIMAL(12,2) | Land value              |
| building_value | DECIMAL(12,2) | Improvements value      |
| total_value    | DECIMAL(12,2) | Total assessed value    |
| taxable_value  | DECIMAL(12,2) | Taxable amount          |
| exempt_amt     | DECIMAL(12,2) | Exemptions              |
| deferred_amt   | DECIMAL(12,2) | Deferred taxes          |
| transfer_date  | DATE          | Last transfer date      |
| notice_date    | DATE          | Notice of value date    |

---

## **4. Parcel_Owners**

Tracks ownership records.
A parcel can have multiple owners; owners can be ranked via `owner_index`.

**Table:** `Parcel_Owners`
**Primary Key:** `owner_id`
**Foreign Key:** `parcel_id` → `Parcels.parcel_id`

| Column          | Type         | Description                             |
| --------------- | ------------ | --------------------------------------- |
| owner_id        | SERIAL       | Unique owner record                     |
| parcel_id       | VARCHAR(50)  | FK to Parcels                           |
| owner_index     | INT          | Order of owners (1st, 2nd, etc.)        |
| owner_name      | VARCHAR(255) | Full owner name                         |
| customer_code   | VARCHAR(50)  | Customer/account code                   |
| owner_type      | VARCHAR(50)  | Type (individual, company, trust, etc.) |
| is_primary      | BOOLEAN      | Primary owner flag                      |
| mailing_address | VARCHAR(255) | Mailing address                         |

---


