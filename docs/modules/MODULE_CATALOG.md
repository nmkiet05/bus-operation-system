# Module: Catalog

## Purpose
Manages all master data required for the system to function. This includes geographical data and operational facilities.

## Core Entities
- **Province**: Geographical regions.
- **Bus Station**: Official transit hubs containing multiple ticket offices.
- **Depot**: Bus parking and maintenance facilities (separated from stations).
- **Ticket Office**: Physical locations where tickets can be purchased.

## Key Features
- **Soft Delete**: Catalog data is rarely hard-deleted to preserve historical integrity. Deletions simply update the `deleted_at` timestamp.
- **Hierarchical Structures**: Uses `parent_id` patterns for nested geographical structures (e.g., Districts within Provinces).
