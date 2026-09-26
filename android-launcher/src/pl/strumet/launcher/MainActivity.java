package pl.strumet.launcher;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

public final class MainActivity extends Activity {
    private static final Uri STRUMET_URL = Uri.parse("https://strumet-mac.tailf2a2cd.ts.net/");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent browser = new Intent(Intent.ACTION_VIEW, STRUMET_URL);
        browser.addCategory(Intent.CATEGORY_BROWSABLE);
        browser.setPackage("com.android.chrome");
        try {
            startActivity(browser);
        } catch (ActivityNotFoundException chromeMissing) {
            browser.setPackage(null);
            try {
                startActivity(browser);
            } catch (ActivityNotFoundException noBrowser) {
                Toast.makeText(this, "Zainstaluj przeglądarkę, aby otworzyć Strumet.", Toast.LENGTH_LONG).show();
            }
        }
        finish();
    }
}
