export interface FruitRow {
  id: string;
  fruit: string;
  updatedAt: string;
  /**
   * A1 notation row number (header row = 1). undefined means the row does not exist yet.
   */
  rowNumber?: number;
}
