package supermastermind.github.io;

import android.Manifest;
import androidx.appcompat.app.AppCompatActivity;
import android.app.Activity;
import android.app.AlertDialog;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.content.Context;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.EditText;
import android.view.View;
import android.util.Log;
import android.text.InputType;
import android.content.pm.PackageInfo;
import android.os.Bundle;
import android.os.Build;
import android.location.Location;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.lang.Math;
import java.util.Date;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.OnFailureListener;

public class MainActivity extends AppCompatActivity {

    private Activity activity;
    private TextView textViewBackground;
    private ProgressBar progressBar;
    private TextView textView;
    private WebView webView;
    private Location myLocation = null;
    private static final int REQUEST_LOCATION = 1;

    private String lastLocation_status = "last location not computed yet";
    private double lastLocation_latitude = -1.0;
    private double lastLocation_longitude = -1.0;
    private float lastLocation_accuracy = (float)-1.0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            setContentView(R.layout.activity_main);
            activity = MainActivity.this;
            textViewBackground = (TextView)findViewById(R.id.text_view_background);
            progressBar = (ProgressBar)findViewById(R.id.progress_bar);
            textView = (TextView)findViewById(R.id.text_view);
            if (isNetworkConnected()) {

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                        // Request location permission
                        requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION},
                                           REQUEST_LOCATION);
                    }
                    else {
                        // Location permission has already been granted
                        // getLastLocation();
                    }
                }

                webView = (WebView)findViewById(R.id.web_view);
                webView.setWebChromeClient(new MyWebChromeClient(activity, webView, textViewBackground, progressBar, textView));
                webView.getSettings().setJavaScriptEnabled(true);
                webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
                webView.getSettings().setDomStorageEnabled(true);
                webView.getSettings().setAppCacheEnabled(true);
                webView.getSettings().setDatabaseEnabled(true);
                webView.getSettings().setGeolocationEnabled(true);
                webView.getSettings().setAllowUniversalAccessFromFileURLs(true);

                webView.getSettings().setUseWideViewPort(true);
                webView.getSettings().setLoadWithOverviewMode(true);

                webView.getSettings().setBuiltInZoomControls(false);
                webView.getSettings().setSupportZoom(false);

                webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);

                // Handle player id
                String playerIdStr = "?";
                try {
                    String fileNameStr = "super_master_mind__player_id";
                    File file = new File(getFilesDir(), fileNameStr);
                    // Generate player id if needed
                    if (!file.exists()) {
                        DateFormat dateFormat = new SimpleDateFormat("_ddMMyy"); // (versus "-ddMMyy" in HTML game)
                        String newPlayerIdStr = makeid() + dateFormat.format(new Date());
                        FileOutputStream outputStream;
                        outputStream = openFileOutput(fileNameStr, Context.MODE_PRIVATE);
                        outputStream.write(newPlayerIdStr.getBytes());
                        outputStream.close();
                        file = new File(getFilesDir(), fileNameStr);
                        if (!file.exists()) {
                            throw new Exception("impossible to create file: " + fileNameStr);
                        }
                    }
                    // Get player id (Java 1.6 compatible)
                    FileInputStream fis = new FileInputStream(file);
                    byte [] bytes = new byte [fis.available()];
                    fis.read(bytes);
                    fis.close();
                    playerIdStr = new String(bytes,"UTF-8");
                } catch (Exception e) {
                    playerIdStr = "? (" + e + ")";
                }

                // Load URL with its parameters
                String versionName = "?";
                int versionCode = -1;
                try {
                    PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
                    versionName= pInfo.versionName;
                    versionCode = pInfo.versionCode;
                }
                catch (Exception e) {
                    e.printStackTrace();
                }
                webView.loadUrl("https://supermastermind.github.io/playonline/game.html?android_appli=".concat(Integer.toString(Build.VERSION.SDK_INT))
                        .concat("&version_name=").concat(versionName)
                        .concat("&version_code=").concat(Integer.toString(versionCode))
                        .concat("&pi=").concat(playerIdStr));

            }
            else {
                textViewBackground.setVisibility(View.GONE);
                progressBar.setVisibility(View.GONE);
                textView.setVisibility(View.GONE);
                displayAlert("Error", "No network connection!\nRerun the appli once you are connected to internet, with mobile network or wifi...", false);
            }
        }
        catch (Exception e) {
            StackTraceElement stack[] = e.getStackTrace();
            String stack_str = "";
            for (StackTraceElement s : stack) {
                stack_str = stack_str + s + "\n";
            }
            displayAlert("Error", e.toString() + "\n" + stack_str, true);
        }
    }

    private boolean isNetworkConnected() {
        // Deprecated code (since API level 29) but no new proper code found valid from Lollipop version
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo n_info = cm.getActiveNetworkInfo();
        if (n_info == null) { // There is no active network
            return false;
        }
        // Note: n_info.getType() can be ConnectivityManager.TYPE_MOBILE or ConnectivityManager.TYPE_WIFI
        return true;
    }

    public void displayAlert(String title_str, String alert_str, final boolean cancelable) {
        AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(this);
        alertDialogBuilder.setTitle(title_str);
        alertDialogBuilder
                .setMessage(alert_str)
                .setCancelable(cancelable);
        if (cancelable) {
            alertDialogBuilder.setNeutralButton(android.R.string.ok, new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface arg0, int arg1) {
                    arg0.dismiss(); // close dialog
                }
            });
        }
        else {
            alertDialogBuilder.setNeutralButton(android.R.string.ok, new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface arg0, int arg1) {
                    finishAndRemoveTask(); // close appli
                }
            });
        }
        AlertDialog alertDialog = alertDialogBuilder.create();
        alertDialog.show();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == REQUEST_LOCATION) {
            if ((grantResults.length == 1) && (grantResults[0] == PackageManager.PERMISSION_GRANTED)) {
                // Location permission was just granted by the user
                // getLastLocation();
            }
            else {
                // Location permission was denied by the user or the request was cancelled
                displayAlert("Message", "Accept to share your location to have your precise country and city names stored with your future scores...", true);
            }
        }
    }

    public void evaluateLocationJavascript(boolean success_case) {
        if (success_case) {
            webView.evaluateJavascript("(function() {let position = {coords: {latitude: " + lastLocation_latitude + ", longitude: " + lastLocation_longitude + ", accuracy: " + lastLocation_accuracy + "}};"
                                       + "HTML_geolocation_success(position, \"" + lastLocation_status + "\");"
                                       + "return 'DONE (SUCCESS)';})();", new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String s) {
                    Log.d("EVALUATEJAVASCRIPT", s);
                }
            });
        }
        else { // error case
            webView.evaluateJavascript("(function() {HTML_geolocation_error(\"" + lastLocation_status + "\");"
                                       + "return 'DONE (ERROR)';})();", new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String s) {
                    Log.d("EVALUATEJAVASCRIPT", s);
                }
            });
        }
    }

    public void getLastLocation() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                lastLocation_status = "last location is being computed (" + new Date() + ")";

                // Get last known location using new Google Play Services SDK
                FusedLocationProviderClient locationClient = LocationServices.getFusedLocationProviderClient(this);

                locationClient.getLastLocation()
                    .addOnSuccessListener(this, new OnSuccessListener<Location>() {
                        @Override
                        public void onSuccess(Location location) {
                            // Got last known location. In some rare situations this can be null.
                            if (location != null) {
                                lastLocation_status = "valid last location (" + new Date() + ")";
                                lastLocation_latitude = location.getLatitude();
                                lastLocation_longitude = location.getLongitude();
                                lastLocation_accuracy = location.getAccuracy();
                                Log.d("LOCATION", "latitude: " + lastLocation_latitude + ", longitude: " + lastLocation_longitude + ", accuracy: " + lastLocation_accuracy + ", status: " + lastLocation_status);
                                evaluateLocationJavascript(true);
                            }
                            else {
                                lastLocation_status = "null last location (" + new Date() + ")";
                                evaluateLocationJavascript(false);
                            }
                        }
                    })
                    .addOnFailureListener(new OnFailureListener() {
                        @Override
                        public void onFailure(Exception e) {
                            lastLocation_status = "last location error (" + e + ", " + new Date() + ")";
                            evaluateLocationJavascript(false);
                            e.printStackTrace();
                        }
                    });
            }
            else {
                lastLocation_status = "last location not computed due to location permission not granted";
                evaluateLocationJavascript(false);
            }
        }
        else {
            lastLocation_status = "last location not computed due to old SDK (" + Build.VERSION.SDK_INT + ")";
            evaluateLocationJavascript(false);
        }
    }

    private String makeid() {
        String text = "";
        String possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for (int i = 0; i < 5; i++) {
            text += possible.charAt((int)Math.floor(Math.random() * possible.length()));
        }
        return text;
    }

}

class MyWebChromeClient extends WebChromeClient {

    private Activity main_activity;
    private WebView webView;
    private TextView textViewBackground;
    private ProgressBar progressBar;
    private TextView textView;
    private boolean delayedSetProgressBarVisibilityGoneAlreadyRequested = false;

    private String currentProgressPrefixStr = "current progress: ";

    MyWebChromeClient(Activity main_activity_p, WebView webview_p, TextView textViewBackground_p, ProgressBar progressBar_p, TextView textView_p) {
        main_activity = main_activity_p;
        webView = webview_p;
        textViewBackground = textViewBackground_p;
        progressBar = progressBar_p;
        textView = textView_p;
    }

    @Override
    public void onProgressChanged(WebView view, int newProgress) {
        super.onProgressChanged(view, newProgress);
        // Log.d("PROGRESS", Integer.toString(newProgress));
        if (!delayedSetProgressBarVisibilityGoneAlreadyRequested) {
            delayedSetProgressBarVisibilityGone(22000); // Do not display progress bar for a too long time (after page load start, scripts load excluded)
            delayedSetProgressBarVisibilityGoneAlreadyRequested = true;
        }
    }

    @Override
    public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
        String messageLowerStr = consoleMessage.message().toLowerCase();
        // Log.d("CONSOLE", consoleMessage.message());
        if (messageLowerStr.contains("on scripts load")) {
            // Remove progress bar once all scripts have been loaded (with a little time margin for proper display)
            delayedSetProgressBarVisibilityGone(999);
        }
        else if (messageLowerStr.startsWith(currentProgressPrefixStr)) {
            String str = messageLowerStr.substring(currentProgressPrefixStr.length());
            int index = str.indexOf("%");
            if (index != -1) {
                str = str.substring(0,index+1);
                String progressStr = "Loading (" + str + ")";
                textView.setText(progressStr);
            }
        }
        else if (messageLowerStr.contains("webview reload request")) {
            webView.reload();
        }
        else if (messageLowerStr.contains("(get last location request)")) {
            // Assumptions:
            // - event after game fully loaded
            // - event after location permission request to the user (if such a request is needed)
            ((MainActivity)main_activity).getLastLocation(); // (will have no effect if location permission has not been granted)
        }
        else if (messageLowerStr.contains("appli close request")) {
            ((MainActivity)main_activity).finishAndRemoveTask(); // close appli
        }
        return true;
        // return super.onConsoleMessage(consoleMessage);
    }

    @Override
    public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
        ((MainActivity)main_activity).displayAlert("Message", message, true);
        result.cancel();
        return true;
    }

    @Override
    public boolean onJsConfirm(WebView view, String url, String message, final JsResult result) {
        new AlertDialog.Builder((MainActivity)main_activity)
                .setTitle("Question")
                .setMessage(message)
                .setCancelable(false)
                .setPositiveButton(android.R.string.ok,
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                                result.confirm();
                            }
                        })
                .setNegativeButton(android.R.string.cancel,
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                                result.cancel();
                            }
                        })
                .create()
                .show();
        return true;
    }

    @Override
    public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, final JsPromptResult result) {
        final EditText input = new EditText((MainActivity)main_activity);
        input.setInputType(InputType.TYPE_CLASS_TEXT);
        input.setText(defaultValue);
        new AlertDialog.Builder((MainActivity)main_activity)
                .setTitle("Info")
                .setView(input)
                .setMessage(message)
                .setCancelable(false)
                .setPositiveButton(android.R.string.ok,
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                                result.confirm(input.getText().toString());
                            }
                        })
                .setNegativeButton(android.R.string.cancel,
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                                result.cancel();
                            }
                        })
                .create()
                .show();
        return true;
    }


    @Override
    public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
        // Always grant permission since the app itself requires location
        // permission and the user has therefore already granted it
        callback.invoke(origin, true, false);
    }

    private void delayedSetProgressBarVisibilityGone(final int time_in_ms) {
        if ((textViewBackground.getVisibility() != View.GONE) || (progressBar.getVisibility() != View.GONE) || (textView.getVisibility() != View.GONE)) {
            Thread thread = new Thread() {
                @Override
                public void run() {
                    try {
                        Thread.sleep(time_in_ms); // Wait for this time before removing progress bar
                    }
                    catch (InterruptedException e) {
                    }
                    main_activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                        textViewBackground.setVisibility(View.GONE);
                        progressBar.setVisibility(View.GONE);
                        textView.setVisibility(View.GONE);
                        }
                    });
                }
            };
            thread.start();
        }
    }

}
