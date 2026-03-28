import { Controller, Get, Post, Param, Query, HttpStatus, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { AdminIssueCreditsDto } from './dto/admin-issue-credits.dto';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('Credits & Wallets')
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance/:organizationId')
  @ApiOperation({ summary: 'Get current credit balance for an organization' })
  @ApiParam({ name: 'organizationId', description: 'The ID or name of the organization' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the balance. If undefined, returns 0.' })
  async getBalance(@Param('organizationId') organizationId: string) {
    return this.creditsService.getBalance(organizationId);
  }

  @Get('transactions/:organizationId')
  @ApiOperation({ summary: 'Get paginated credit transactions for an organization' })
  @ApiParam({ name: 'organizationId', description: 'The ID or name of the organization' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns paginated transaction history sorted desc by date.' })
  async getTransactions(
    @Param('organizationId') organizationId: string,
    @Query() query: GetTransactionsDto,
  ) {
    return this.creditsService.getTransactions(organizationId, query.page, query.limit);
  }

  @Post('issue/manual')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manual retry mechanism for credit issuance (Admin Only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Credits issued successfully.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Credits already issued (Idempotent)' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Payment or active pricing not found' })
  async manualIssueCredits(@Body('paymentId') paymentId: string) {
    return this.creditsService.issueCreditsAfterPayment(paymentId);
  }

  @Post('issue/admin')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin directly issues credits to an organization without a payment' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Credits issued successfully by Admin.' })
  @ApiBody({ type: AdminIssueCreditsDto })
  async adminIssueCredits(@Body() dto: AdminIssueCreditsDto) {
    return this.creditsService.adminIssueCredits(dto.organizationId, dto.credits, dto.reason);
  }
}
