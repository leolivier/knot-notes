import { KnotNewPage } from './app.po';

describe('knot-new App', () => {
  let page: KnotNewPage;

  beforeEach(() => {
    page = new KnotNewPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
