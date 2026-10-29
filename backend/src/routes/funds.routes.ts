import { Router } from 'express';
import { AMFI_DIRECT_FUNDS_SEED } from '../data/amfiFunds.seed';
import { authenticateOrDemoRia } from '../middleware/auth.middleware';
import { scoreAmfiDirectFund } from '../services/quant/portfolioBuilder';

export const fundsRouter = Router();

fundsRouter.get('/', authenticateOrDemoRia, (req, res) => {
  const { assetClass, maxTer, minTenure } = req.query as {
    assetClass?: string;
    maxTer?: string;
    minTenure?: string;
  };

  let schemes = AMFI_DIRECT_FUNDS_SEED.map((s) => {
    const scored = scoreAmfiDirectFund(s);
    return {
      ...s,
      selectionScore: scored.score,
      selectionSummary: scored.summary,
    };
  });

  if (assetClass && assetClass !== 'ALL') {
    schemes = schemes.filter((s) => s.assetClass === assetClass.toUpperCase());
  }
  if (maxTer) {
    schemes = schemes.filter((s) => s.expenseRatioPct <= parseFloat(maxTer));
  }
  if (minTenure) {
    schemes = schemes.filter((s) => s.managerTenureYears >= parseFloat(minTenure));
  }

  schemes.sort((a, b) => b.selectionScore - a.selectionScore);

  res.json({
    count: schemes.length,
    universeMandate: 'AMFI Direct Plan - Growth Universe (0.00% Distributor Commission)',
    schemes,
  });
});
