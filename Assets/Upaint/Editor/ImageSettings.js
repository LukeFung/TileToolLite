class ImageSettings extends EditorWindow
{
	static var thisWindow : EditorWindow;
	static var state : String;
	static var window : EditorWindow;
	static var splits : int[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
	static var splitsT : String[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"];
	static var split : int = 2;
	static var pixs : int[] = [16, 32, 64];
	static var pixsT : String[] = ["16", "32", "64"];
	static var pix : int = 16;
	static var importImage : Texture2D;
	
	static function ShowWindow()
	{
		window = EditorWindow.GetWindow(UPaint);
		importImage = null;
		thisWindow = GetWindow(ImageSettings);
		thisWindow.position = Rect(Screen.width/2 + 100, Screen.height/2 + 100, 0, 0);
		thisWindow.maxSize = Vector2(250, 120);
		thisWindow.minSize = thisWindow.maxSize;
		thisWindow.Show();
	}
	
	function OnGUI()
	{
		if(state == "NewTileset")
		{
			split = EditorGUILayout.IntPopup("How many tiles Wide: ", split, splitsT, splits);
			pix = EditorGUILayout.IntPopup("Pixels Per Tile: ", pix, pixsT, pixs);
			if(GUILayout.Button("Create"))
			{
				if(window.image)
				{
					if(EditorUtility.DisplayDialog("Are you sure?", "Any unsaved progress will be lost", "Continue", "Cancel"))
					{
						window.CreateNewSheet(pix * split, split);
						thisWindow.Close();
					}
				}
				else
				{
					window.CreateNewSheet(pix * split, split);
					thisWindow.Close();
				}
			}
		}
		if(state == "ImportTileset")
		{
			split = EditorGUILayout.IntPopup("How many tiles Wide: ", split, splitsT, splits);
			pix = EditorGUILayout.IntPopup("Pixels Per Tile: ", pix, pixsT, pixs);
			importImage = EditorGUILayout.ObjectField(importImage, Texture2D, false);
			if(GUILayout.Button("Import"))
			{
				if(importImage)
				{
					if(importImage.width == pix * split && importImage.height == pix * split)
					{
						if(window.image)
						{
							if(EditorUtility.DisplayDialog("Are you sure?", "Any unsaved progress will be lost", "Continue", "Cancel"))
							{
								window.ImportSheet(pix * split, split, importImage);
								thisWindow.Close();
							}
						}
						else
						{
							window.ImportSheet(pix * split, split, importImage);
							thisWindow.Close();
						}
					}
					else
					{
						if(EditorUtility.DisplayDialog("Size Mismatch", "The settings " + pix + " pixels * " + split  + " splits" + " does not match the image import size (" + importImage.width.ToString() + "x" + importImage.height.ToString() + ") . Would you like to resize the image?", "Ok", "Cancel"))
						{
							var path = AssetDatabase.GetAssetPath(importImage);
							var ti : TextureImporter = AssetImporter.GetAtPath(path);
							ti.maxTextureSize = parseInt(pix * split);
							AssetDatabase.ImportAsset(path);
							
							window.ImportSheet(pix * split, split, importImage);
							thisWindow.Close();
						}
					}
				}
				else
				{
					EditorUtility.DisplayDialog("No image selected", "No image has been selected. Please select an image before continuing", "Ok");
				}
			}
		}
		if(state == "ImportTile")
		{
			importImage = EditorGUILayout.ObjectField(importImage, Texture2D, false);
			if(GUILayout.Button("Import"))
			{
				if(importImage)
				{
					if(importImage.width == pix && importImage.height == pix)
					{
						window.ImportTile(importImage);
						thisWindow.Close();
					}
					else
					{
						EditorUtility.DisplayDialog("Incorrect Size", "The image you have selected is not " + pix + "x" + pix + ". Please use the correct size for the current tileset.", "Ok");
					}
				}
				else
				{
					EditorUtility.DisplayDialog("No image selected", "No image has been selected. Please select an image before continuing", "Ok");
				}
			}
		}
	}
}