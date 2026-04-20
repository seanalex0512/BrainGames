import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@braingames/shared';

export interface FieldValidator {
  required?: boolean;
  type?: string;
  validate?: (value: unknown) => string | null;
}

export type ValidationSchema = Record<string, FieldValidator>;

export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    const body = req.body as Record<string, unknown>;

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];
      const isPresent = value !== undefined && value !== null;

      if (rules.required && !isPresent) {
        errors.push(`"${field}" is required`);
        continue;
      }

      if (isPresent && rules.type && typeof value !== rules.type) {
        errors.push(`"${field}" must be of type ${rules.type}`);
        continue;
      }

      if (isPresent && rules.validate) {
        const customError = rules.validate(value);
        if (customError) {
          errors.push(customError);
        }
      }
    }

    if (errors.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: errors.join('; '),
      };
      res.status(400).json(response);
      return;
    }

    next();
  };
}
