import { AngunotesPage } from './app.po';

describe('angunotes App', function() {
  let page: AngunotesPage;

  beforeEach(() => {
    page = new AngunotesPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
