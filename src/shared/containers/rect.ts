export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * TODO: Margins, Trim, Insets, Offset
 */
export interface Margins {
  /** The x-axis distance from the left bound. */
  readonly left: number;
  /** The y-axis distance from the top bound. */
  readonly top: number;
  /** The x-axis distance from the right bound. */
  readonly right: number;
  /** The y-axis distance from the bottom bound. */
  readonly bottom: number;
}
