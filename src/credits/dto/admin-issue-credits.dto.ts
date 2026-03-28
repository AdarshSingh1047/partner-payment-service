import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsPositive, IsOptional } from 'class-validator';

export class AdminIssueCreditsDto {
  @ApiProperty({ description: 'The organization to issue credits to', example: 'Org_Antigravity' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ description: 'Exact number of credits to issue manually', example: 500 })
  @IsInt()
  @IsPositive()
  credits: number;

  @ApiPropertyOptional({ description: 'Reason or context for the manual issuance', example: 'Manual adjustment by admin' })
  @IsString()
  @IsOptional()
  reason?: string;
}
